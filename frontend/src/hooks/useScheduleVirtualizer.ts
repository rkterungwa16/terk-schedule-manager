import { useCallback, useMemo, useRef, useState } from 'react';
import type { ScheduleRow } from '../types/calendar.types';

/**
 * The reference implementation computes each row's position analytically —
 * `startRow = floor(scrollTop / rowHeight)` — because every tile is the
 * same square size. Our rows aren't uniform: a month divider is short, and
 * a day row's height depends on how many events it holds (and whether a
 * long event name wraps to a second line). So instead of `index *
 * rowHeight` we keep a running prefix-sum "offsets" array — offsets[i] is
 * the pixel position where row i starts — and locate rows in it by binary
 * search. This is the standard generalization of the reference's approach
 * for variable-size content; the underlying idea (turn a scroll position
 * into a row range with some overscan) is the same.
 *
 * Heights are looked up by each row's stable `key`, not by its array
 * index — a row's measured height stays attached to that row's identity
 * no matter how far its index shifts when months are prepended in front
 * of it. An index-keyed cache would hand back a stale height for whatever
 * used to occupy that slot.
 */

const DIVIDER_HEIGHT_ESTIMATE = 36;
const DAY_ROW_MIN_HEIGHT_ESTIMATE = 60;
const EVENT_LINE_HEIGHT_ESTIMATE = 28;

function estimateRowHeight(row: ScheduleRow): number {
  if (row.kind === 'month-divider') return DIVIDER_HEIGHT_ESTIMATE;
  // A day row's height is dominated by whichever is taller: the fixed
  // date column, or its stack of event lines. This is only a starting
  // guess — ResizeObserver corrects it to the real rendered height once
  // the row actually mounts (see measureRow below).
  return Math.max(
    DAY_ROW_MIN_HEIGHT_ESTIMATE,
    24 + row.group.events.length * EVENT_LINE_HEIGHT_ESTIMATE
  );
}

const OVERSCAN_PX = 400;

interface VisibleRange {
  start: number;
  end: number; // exclusive
}

export function useScheduleVirtualizer(rows: ScheduleRow[]) {
  const heightsRef = useRef(new Map<string, number>());
  // Bumped whenever a real measurement meaningfully corrects an estimate,
  // to force `offsets` to recompute even though `rows` itself hasn't
  // changed identity.
  const [heightVersion, setHeightVersion] = useState(0);

  const offsets = useMemo(() => {
    const result = new Array<number>(rows.length + 1);
    result[0] = 0;
    for (let i = 0; i < rows.length; i++) {
      const height = heightsRef.current.get(rows[i].key) ?? estimateRowHeight(rows[i]);
      result[i + 1] = result[i] + height;
    }
    return result;
    // heightVersion is a deliberate dependency with no direct read here —
    // it's the signal that a cached height changed since the last render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, heightVersion]);

  const totalHeight = offsets[rows.length] ?? 0;

  const findIndexForOffset = useCallback(
    (target: number) => {
      let low = 0;
      let high = rows.length;
      while (low < high) {
        const mid = (low + high) >>> 1;
        if (offsets[mid + 1] <= target) low = mid + 1;
        else high = mid;
      }
      return Math.min(low, Math.max(rows.length - 1, 0));
    },
    [offsets, rows.length]
  );

  const [range, setRange] = useState<VisibleRange>({ start: 0, end: Math.min(rows.length, 20) });

  /** The direct analog of the reference's computeVisibleRows: turn a
   *  scroll position + viewport height into a row range, padded by a
   *  pixel overscan instead of a fixed row count (since rows vary in
   *  height, a row-count overscan wouldn't correspond to a consistent
   *  pixel buffer the way it does for the reference's uniform tiles). */
  const recomputeRange = useCallback(
    (scrollTop: number, viewportHeight: number) => {
      const lowBound = scrollTop - OVERSCAN_PX;
      const highBound = scrollTop + viewportHeight + OVERSCAN_PX;

      const start = findIndexForOffset(Math.max(0, lowBound));
      let end = findIndexForOffset(highBound) + 1;
      end = Math.min(end, rows.length);

      setRange((prev) => (prev.start === start && prev.end === end ? prev : { start, end }));
    },
    [findIndexForOffset, rows.length]
  );

  // One shared ResizeObserver, rows attached/detached as they scroll into
  // and out of the rendered window — the vanilla equivalent of what a
  // measurement-based virtualizer library does internally, just written
  // out directly instead of hidden behind an API.
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const elementKeysRef = useRef(new Map<Element, string>());
  const measureRowCallbacksRef = useRef(new Map<string, (el: HTMLElement | null) => void>());

  if (!resizeObserverRef.current) {
    resizeObserverRef.current = new ResizeObserver((entries) => {
      let changed = false;
      for (const entry of entries) {
        const key = elementKeysRef.current.get(entry.target);
        if (!key) continue;
        const measured = Math.round(entry.contentRect.height);
        const current = heightsRef.current.get(key);
        // Sub-pixel differences aren't worth a re-render; a wrapped event
        // name or a different event count changes height by much more
        // than a pixel, so this threshold only filters out layout noise.
        if (current === undefined || Math.abs(current - measured) > 1) {
          heightsRef.current.set(key, measured);
          changed = true;
        }
      }
      if (changed) setHeightVersion((v) => v + 1);
    });
  }

  const measureRow = useCallback(
    (key: string) => {
      // Cache the callback per key so the same row gets the *same*
      // function reference across renders. Without this, calling
      // `measureRow(key)` inline in JSX would hand React a brand-new
      // closure every render — and a ref callback's identity changing is
      // exactly what makes React call it with `null` (as if the element
      // unmounted) and then immediately again with the element, causing
      // needless unobserve/observe churn on every unrelated re-render.
      const cached = measureRowCallbacksRef.current.get(key);
      if (cached) return cached;

      const callback = (el: HTMLElement | null) => {
        const observer = resizeObserverRef.current;
        if (!observer) return;
        if (el === null) {
          // React calls the ref callback with `null` on unmount — the row
          // has scrolled out of the rendered window. Stop observing it
          // rather than leaking a reference to a detached node.
          for (const [element, elementKey] of elementKeysRef.current) {
            if (elementKey === key) {
              observer.unobserve(element);
              elementKeysRef.current.delete(element);
            }
          }
          return;
        }
        elementKeysRef.current.set(el, key);
        observer.observe(el);
      };

      measureRowCallbacksRef.current.set(key, callback);
      return callback;
    },
    []
  );

  return { offsets, totalHeight, range, recomputeRange, measureRow, findIndexForOffset };
}

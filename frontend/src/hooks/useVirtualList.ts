import { useCallback, useMemo, useRef, useState } from 'react';

/**
 * The reference implementation computes each row's position analytically —
 * `startRow = floor(scrollTop / rowHeight)` — because every tile is the
 * same square size. Schedule rows aren't uniform (a divider is short, a
 * day's height depends on its event count), so this hook keeps a running
 * prefix-sum "offsets" array instead and locates items in it by binary
 * search — the standard generalization of the reference's approach for
 * variable-size content.
 *
 * Generic over `T extends { key: string }` rather than hardcoded to
 * Schedule view's row type: Month view's continuous scroll needs the exact
 * same mechanics — a scroll position turned into a visible range, with
 * measurement-corrected heights keyed by identity so prepending doesn't
 * misattribute a cached height to the wrong item — just over month blocks
 * instead of day rows. Duplicating this file for "month blocks" instead of
 * "schedule rows" would mean two copies of the same prefix-sum/binary-
 * search/ResizeObserver machinery to keep in sync; a generic function
 * means there's one implementation, and each caller only supplies what's
 * actually different — its own items and its own size estimate.
 *
 * Heights are looked up by each item's stable `key`, not its array index —
 * an item's measured height stays attached to its identity no matter how
 * far its index shifts when new items are prepended in front of it. An
 * index-keyed cache would hand back a stale height for whatever used to
 * occupy that slot.
 */

const OVERSCAN_PX = 400;

interface VisibleRange {
  start: number;
  end: number; // exclusive
}

export function useVirtualList<T extends { key: string }>(
  items: T[],
  estimateSize: (item: T) => number
) {
  const heightsRef = useRef(new Map<string, number>());
  // Bumped whenever a real measurement meaningfully corrects an estimate,
  // to force `offsets` to recompute even though `items` itself hasn't
  // changed identity.
  const [heightVersion, setHeightVersion] = useState(0);

  const offsets = useMemo(() => {
    const result = new Array<number>(items.length + 1);
    result[0] = 0;
    for (let i = 0; i < items.length; i++) {
      const height = heightsRef.current.get(items[i].key) ?? estimateSize(items[i]);
      result[i + 1] = result[i] + height;
    }
    return result;
    // heightVersion is a deliberate dependency with no direct read here —
    // it's the signal that a cached height changed since the last render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, heightVersion]);

  const totalHeight = offsets[items.length] ?? 0;

  const findIndexForOffset = useCallback(
    (target: number) => {
      let low = 0;
      let high = items.length;
      while (low < high) {
        const mid = (low + high) >>> 1;
        if (offsets[mid + 1] <= target) low = mid + 1;
        else high = mid;
      }
      return Math.min(low, Math.max(items.length - 1, 0));
    },
    [offsets, items.length]
  );

  const [range, setRange] = useState<VisibleRange>({ start: 0, end: Math.min(items.length, 20) });

  /** The direct analog of the reference's computeVisibleRows: turn a
   *  scroll position + viewport height into an item range, padded by a
   *  pixel overscan instead of a fixed item count (since items vary in
   *  height, an item-count overscan wouldn't correspond to a consistent
   *  pixel buffer the way it does for the reference's uniform tiles). */
  const recomputeRange = useCallback(
    (scrollTop: number, viewportHeight: number) => {
      const lowBound = scrollTop - OVERSCAN_PX;
      const highBound = scrollTop + viewportHeight + OVERSCAN_PX;

      const start = findIndexForOffset(Math.max(0, lowBound));
      let end = findIndexForOffset(highBound) + 1;
      end = Math.min(end, items.length);

      setRange((prev) => (prev.start === start && prev.end === end ? prev : { start, end }));
    },
    [findIndexForOffset, items.length]
  );

  // One shared ResizeObserver, items attached/detached as they scroll into
  // and out of the rendered window — the vanilla equivalent of what a
  // measurement-based virtualizer library does internally, just written
  // out directly instead of hidden behind an API.
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const elementKeysRef = useRef(new Map<Element, string>());
  const measureItemCallbacksRef = useRef(new Map<string, (el: HTMLElement | null) => void>());

  if (!resizeObserverRef.current) {
    resizeObserverRef.current = new ResizeObserver((entries) => {
      let changed = false;
      for (const entry of entries) {
        const key = elementKeysRef.current.get(entry.target);
        if (!key) continue;
        const measured = Math.round(entry.contentRect.height);
        const current = heightsRef.current.get(key);
        // Sub-pixel differences aren't worth a re-render; real content
        // changes (a wrapped line, a different day count) change height
        // by much more than a pixel, so this threshold only filters out
        // layout noise.
        if (current === undefined || Math.abs(current - measured) > 1) {
          heightsRef.current.set(key, measured);
          changed = true;
        }
      }
      if (changed) setHeightVersion((v) => v + 1);
    });
  }

  const measureItem = useCallback(
    (key: string) => {
      // Cache the callback per key so the same item gets the *same*
      // function reference across renders. Without this, calling
      // `measureItem(key)` inline in JSX would hand React a brand-new
      // closure every render — and a ref callback's identity changing is
      // exactly what makes React call it with `null` (as if the element
      // unmounted) and then immediately again with the element, causing
      // needless unobserve/observe churn on every unrelated re-render.
      const cached = measureItemCallbacksRef.current.get(key);
      if (cached) return cached;

      const callback = (el: HTMLElement | null) => {
        const observer = resizeObserverRef.current;
        if (!observer) return;
        if (el === null) {
          // React calls the ref callback with `null` on unmount — the item
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

      measureItemCallbacksRef.current.set(key, callback);
      return callback;
    },
    []
  );

  return { offsets, totalHeight, range, recomputeRange, measureItem, findIndexForOffset };
}

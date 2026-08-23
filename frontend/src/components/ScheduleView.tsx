import { useCallback, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import type { CalendarEvent, ScheduleRow } from '../types/calendar.types';
import { isSameDay } from '../utils/dateUtils';
import { raf1 } from '../utils/raf1';
import { useInfiniteMonths } from '../hooks/useInfiniteMonths';
import { useScheduleRows } from '../hooks/useScheduleRows';
import { useVirtualList } from '../hooks/useVirtualList';
import { ScheduleDayRow } from './ScheduleDayRow';
import { ScheduleMonthDivider } from './ScheduleMonthDivider';

const DIVIDER_HEIGHT_ESTIMATE = 36;
const DAY_ROW_MIN_HEIGHT_ESTIMATE = 60;
const EVENT_LINE_HEIGHT_ESTIMATE = 28;

/** Schedule-row-specific size estimate, passed into the generic
 *  `useVirtualList` rather than living inside it — a day row's height is
 *  dominated by whichever is taller: the fixed date column, or its stack
 *  of event lines. This is only a starting guess — ResizeObserver corrects
 *  it to the real rendered height once the row actually mounts. */
function estimateRowHeight(row: ScheduleRow): number {
  if (row.kind === 'month-divider') return DIVIDER_HEIGHT_ESTIMATE;
  return Math.max(
    DAY_ROW_MIN_HEIGHT_ESTIMATE,
    24 + row.group.events.length * EVENT_LINE_HEIGHT_ESTIMATE
  );
}

interface ScheduleViewProps {
  events: CalendarEvent[];
  /** Month to center the initial scroll window on — typically whatever
   *  month Month view is currently showing, so switching views feels
   *  continuous rather than resetting somewhere arbitrary. */
  initialMonth: Date;
  /** Called whenever the month at the top of the visible viewport changes
   *  — lets the header track what's actually on screen as the user
   *  scrolls, the same way a physical desk calendar's visible page tells
   *  you what month you're on. */
  onVisibleMonthChange?: (month: Date) => void;
}

const TODAY = new Date();

/** How far (in pixels) from either edge of the loaded content the
 *  IntersectionObserver sentinels start intersecting — deliberately larger
 *  than the render overscan, so the next month's data is already loading
 *  before the user scrolls into the rendering buffer zone and could see
 *  blank space. Same idea as the reference's 1200px sentinel rootMargin,
 *  scaled down for our shorter rows. */
const SENTINEL_MARGIN_PX = 800;

export function ScheduleView({ events, initialMonth, onVisibleMonthChange }: ScheduleViewProps) {
  const { months, loadPast, loadFuture, ensureMonthLoaded } = useInfiniteMonths(initialMonth);
  const rows = useScheduleRows(months, events);
  const { offsets, totalHeight, range, recomputeRange, measureItem, findIndexForOffset } =
    useVirtualList(rows, estimateRowHeight);

  const scrollElementRef = useRef<HTMLDivElement | null>(null);
  const topSentinelRef = useRef<HTMLDivElement | null>(null);
  const bottomSentinelRef = useRef<HTMLDivElement | null>(null);

  // Locks: at most one load per direction in flight at a time, mirroring
  // the reference's single `loading` flag (there it only needed one,
  // since photos only ever load in one direction).
  const isLoadingPastRef = useRef(false);
  const isLoadingFutureRef = useRef(false);

  // Captured the instant a past-load is triggered: which row was at the
  // very top of the scrolled content, and how far the user had scrolled
  // *into* that row (not just which row — preserving the sub-row offset
  // is what keeps the jump imperceptible rather than snapping to the row
  // boundary). Looked back up by key (not index) once the prepended
  // month's rows exist, since the anchor row's index shifts forward by
  // however many rows were just prepended in front of it.
  const pastAnchorRef = useRef<{ key: string; withinRowOffset: number } | null>(null);
  const pendingTodayScrollRef = useRef(false);

  // Tracks the last month reported to the parent, keyed as "year-month" so
  // a re-render that doesn't actually change months (most of them — this
  // fires on every scroll tick) doesn't call `onVisibleMonthChange` again
  // with the same value.
  const lastReportedMonthKeyRef = useRef<string | null>(null);

  const reportVisibleMonth = useCallback(
    (scrollTop: number) => {
      if (!onVisibleMonthChange || rows.length === 0) return;
      const row = rows[findIndexForOffset(scrollTop)];
      if (!row) return;
      const key = `${row.month.getFullYear()}-${row.month.getMonth()}`;
      if (key === lastReportedMonthKeyRef.current) return;
      lastReportedMonthKeyRef.current = key;
      onVisibleMonthChange(row.month);
    },
    [rows, findIndexForOffset, onVisibleMonthChange]
  );

  const handleIntersectTop = useCallback(() => {
    if (isLoadingPastRef.current) return;
    const el = scrollElementRef.current;
    if (!el) return;

    const anchorIndex = findIndexForOffset(el.scrollTop);
    const anchorRow = rows[anchorIndex];
    pastAnchorRef.current = anchorRow
      ? { key: anchorRow.key, withinRowOffset: el.scrollTop - offsets[anchorIndex] }
      : null;

    isLoadingPastRef.current = true;
    loadPast();
  }, [rows, offsets, findIndexForOffset, loadPast]);

  const handleIntersectBottom = useCallback(() => {
    if (isLoadingFutureRef.current) return;
    isLoadingFutureRef.current = true;
    loadFuture();
  }, [loadFuture]);

  // Stored in refs so the IntersectionObserver below can be set up once,
  // on mount, rather than torn down and recreated every time `rows`
  // changes (which is what including these functions directly in the
  // effect's dependency array would force, since they close over `rows`).
  const handleIntersectTopRef = useRef(handleIntersectTop);
  handleIntersectTopRef.current = handleIntersectTop;
  const handleIntersectBottomRef = useRef(handleIntersectBottom);
  handleIntersectBottomRef.current = handleIntersectBottom;

  // Direct analog of the reference's `_sentinelObserver`: a sentinel
  // element sitting past the edge of the loaded content triggers the next
  // load once it comes within `rootMargin` of the viewport. We use two —
  // one pinned to the very top of the virtual space, one pinned to its
  // very bottom — instead of the reference's single bottom sentinel,
  // since schedule data can grow in either direction.
  useEffect(() => {
    const root = scrollElementRef.current;
    const topEl = topSentinelRef.current;
    const bottomEl = bottomSentinelRef.current;
    if (!root || !topEl || !bottomEl) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          if (entry.target === topEl) handleIntersectTopRef.current();
          else if (entry.target === bottomEl) handleIntersectBottomRef.current();
        }
      },
      { root, rootMargin: `${SENTINEL_MARGIN_PX}px 0px` }
    );

    observer.observe(topEl);
    observer.observe(bottomEl);
    return () => observer.disconnect();
  }, []);

  // Resolves whichever load is in flight once `rows`/`offsets` reflect it:
  // for a past-load, jumps straight to the tracked anchor's new position
  // (undoing the prepend's visual shift); for a future-load, there's
  // nothing to undo — appended rows land after everything already on
  // screen. Also re-syncs the rendered range in both cases, since the
  // available rows (and therefore what should be rendered) just changed.
  useLayoutEffect(() => {
    const el = scrollElementRef.current;

    if (isLoadingPastRef.current) {
      const anchor = pastAnchorRef.current;
      isLoadingPastRef.current = false;
      pastAnchorRef.current = null;
      if (anchor && el) {
        const newIndex = rows.findIndex((row) => row.key === anchor.key);
        if (newIndex >= 0) {
          el.scrollTop = offsets[newIndex] + anchor.withinRowOffset;
        }
      }
    }

    if (isLoadingFutureRef.current) {
      isLoadingFutureRef.current = false;
    }

    if (el) {
      recomputeRange(el.scrollTop, el.clientHeight);
      reportVisibleMonth(el.scrollTop);
    }
    // Deliberately not depending on `recomputeRange`/`reportVisibleMonth`'s
    // own inputs beyond `rows`/`offsets` — those two changing is exactly
    // "the data this effect needs to react to changed."
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, offsets]);

  // The scroll-driven counterpart to the effect above: recomputes which
  // rows should be rendered, and which month the header should reflect, as
  // the user actually scrolls — throttled to at most once per animation
  // frame via `raf1`, identical in spirit to the reference's
  // `_scheduleRecalc`.
  const handleScroll = useMemo(
    () =>
      raf1(() => {
        const el = scrollElementRef.current;
        if (!el) return;
        recomputeRange(el.scrollTop, el.clientHeight);
        reportVisibleMonth(el.scrollTop);
      }),
    [recomputeRange, reportVisibleMonth]
  );

  useEffect(() => {
    if (!pendingTodayScrollRef.current) return;
    const todayIndex = rows.findIndex((row) => row.kind === 'day' && isSameDay(row.group.date, TODAY));
    if (todayIndex >= 0) {
      pendingTodayScrollRef.current = false;
      const el = scrollElementRef.current;
      if (el) el.scrollTop = offsets[todayIndex];
    }
  }, [rows, offsets]);

  const handleJumpToToday = useCallback(() => {
    pendingTodayScrollRef.current = true;
    ensureMonthLoaded(TODAY);
  }, [ensureMonthLoaded]);

  return (
    <div className="schedule-view-wrapper">
      <button type="button" className="schedule-today-button" onClick={handleJumpToToday}>
        Today
      </button>
      <div className="schedule-view" ref={scrollElementRef} onScroll={handleScroll}>
        <div className="schedule-virtual-space" style={{ height: totalHeight }}>
          <div ref={topSentinelRef} className="schedule-sentinel" style={{ top: 0 }} />
          <div ref={bottomSentinelRef} className="schedule-sentinel" style={{ top: totalHeight }} />

          <div
            className="schedule-window"
            style={{ transform: `translateY(${offsets[range.start] ?? 0}px)` }}
          >
            {rows.slice(range.start, range.end).map((row) => (
              <div key={row.key} ref={measureItem(row.key)} className="schedule-row">
                {row.kind === 'month-divider' ? (
                  <ScheduleMonthDivider label={row.label} />
                ) : (
                  <ScheduleDayRow group={row.group} today={TODAY} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

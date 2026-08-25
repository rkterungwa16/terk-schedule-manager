import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
} from "react";
import type { CalendarEvent } from "../types/calendar.types";
import { isSameMonth } from "../utils/dateUtils";
import { raf1 } from "../utils/raf1";
import { useInfiniteMonths } from "../hooks/useInfiniteMonths";
import { useVirtualList } from "../hooks/useVirtualList";
import { MonthBlock } from "./MonthBlock";

interface MonthBlockItem {
  key: string;
  month: Date;
}

interface MonthScrollViewProps {
  events: CalendarEvent[];
  initialMonth: Date;
  selectedDate: Date | null;
  onSelectDay: (date: Date) => void;
  onAddEvent: () => void;
  onViewEvent: (event: CalendarEvent) => void;
  onCloseDetails: () => void;
  onVisibleMonthChange?: (month: Date) => void;
}

const TODAY = new Date();

/** A month block's height varies slightly (an open DayDetails panel adds
 *  to it), but is otherwise dominated by its fixed 6-week grid — this is
 *  only the initial guess `useVirtualList` corrects via ResizeObserver
 *  once a block actually mounts, same as Schedule view's per-row estimate. */
const MONTH_BLOCK_HEIGHT_ESTIMATE = 470;

/** Same reasoning as Schedule view's SENTINEL_MARGIN_PX: comfortably larger
 *  than the render overscan, so the next month is already loading before
 *  the user scrolls far enough to see blank space. */
const SENTINEL_MARGIN_PX = 800;

function monthKey(month: Date): string {
  return `${month.getFullYear()}-${month.getMonth()}`;
}

/**
 * Structurally this is Schedule view's virtualization scaffolding
 * (IntersectionObserver sentinels, raf1-throttled scroll, anchor-preserving
 * prepend, Today button, visible-item reporting) applied to month blocks
 * instead of day rows. It isn't extracted into one shared hook covering
 * both — the two views' "what am I looking for" logic differs enough
 * (Schedule finds a specific day row; this finds a specific month item)
 * that forcing a shared abstraction over glue code this thin would cost
 * more clarity than it'd save. What *is* shared is the real reusable part:
 * `useInfiniteMonths` for loaded-month bookkeeping and `useVirtualList` for
 * the actual virtualization math — see those files for the parts that
 * would have been duplicated otherwise.
 */
export function MonthScrollView({
  events,
  initialMonth,
  selectedDate,
  onSelectDay,
  onAddEvent,
  onViewEvent,
  onCloseDetails,
  onVisibleMonthChange,
}: MonthScrollViewProps) {
  const { months, loadPast, loadFuture, ensureMonthLoaded } =
    useInfiniteMonths(initialMonth);

  const items = useMemo<MonthBlockItem[]>(() => {
    const seen = new Set<string>();
    const result: MonthBlockItem[] = [];
    for (const month of months) {
      const key = monthKey(month);
      if (seen.has(key)) continue;
      seen.add(key);
      result.push({ key, month });
    }
    return result;
  }, [months]);

  const {
    offsets,
    totalHeight,
    range,
    recomputeRange,
    measureItem,
    findIndexForOffset,
  } = useVirtualList(items, () => MONTH_BLOCK_HEIGHT_ESTIMATE);

  const scrollElementRef = useRef<HTMLDivElement | null>(null);
  const topSentinelRef = useRef<HTMLDivElement | null>(null);
  const bottomSentinelRef = useRef<HTMLDivElement | null>(null);

  const isLoadingPastRef = useRef(false);
  const isLoadingFutureRef = useRef(false);
  const pastAnchorRef = useRef<{
    key: string;
    withinItemOffset: number;
  } | null>(null);
  const pendingTodayScrollRef = useRef(false);
  // Guards the mount-time jump below so it only ever fires once — after
  // that, scroll position is the user's (or the "Today" button's) to
  // control, not something to keep silently resetting.
  const hasDoneInitialScrollRef = useRef(false);

  const lastReportedMonthKeyRef = useRef<string | null>(null);

  const reportVisibleMonth = useCallback(
    (scrollTop: number) => {
      if (!onVisibleMonthChange || items.length === 0) return;
      const item = items[findIndexForOffset(scrollTop)];
      if (!item) return;
      if (item.key === lastReportedMonthKeyRef.current) return;
      lastReportedMonthKeyRef.current = item.key;
      onVisibleMonthChange(item.month);
    },
    [items, findIndexForOffset, onVisibleMonthChange],
  );

  const handleIntersectTop = useCallback(() => {
    if (isLoadingPastRef.current) return;
    const el = scrollElementRef.current;
    if (!el) return;

    const anchorIndex = findIndexForOffset(el.scrollTop);
    const anchorItem = items[anchorIndex];
    pastAnchorRef.current = anchorItem
      ? {
          key: anchorItem.key,
          withinItemOffset: el.scrollTop - offsets[anchorIndex],
        }
      : null;

    isLoadingPastRef.current = true;
    loadPast();
  }, [items, offsets, findIndexForOffset, loadPast]);

  const handleIntersectBottom = useCallback(() => {
    if (isLoadingFutureRef.current) return;
    isLoadingFutureRef.current = true;
    loadFuture();
  }, [loadFuture]);

  const handleIntersectTopRef = useRef(handleIntersectTop);
  handleIntersectTopRef.current = handleIntersectTop;
  const handleIntersectBottomRef = useRef(handleIntersectBottom);
  handleIntersectBottomRef.current = handleIntersectBottom;

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
          else if (entry.target === bottomEl)
            handleIntersectBottomRef.current();
        }
      },
      { root, rootMargin: `${SENTINEL_MARGIN_PX}px 0px` },
    );

    observer.observe(topEl);
    observer.observe(bottomEl);
    return () => observer.disconnect();
  }, []);

  useLayoutEffect(() => {
    const el = scrollElementRef.current;

    // The initial loaded window is [previous month, current month, next
    // month] (see useInfiniteMonths), and a freshly-mounted scroll
    // container starts at scrollTop 0 — the top of the *earliest* loaded
    // month, not the current one. Without this, the page would open on
    // last month's grid and require an immediate scroll just to reach
    // "now," which is exactly the bug being fixed here: jump straight to
    // `initialMonth`'s offset before the very first paint, once, the
    // moment it's actually present in `items`.
    if (!hasDoneInitialScrollRef.current && el) {
      const initialIndex = items.findIndex((item) =>
        isSameMonth(item.month, initialMonth),
      );
      if (initialIndex >= 0) {
        hasDoneInitialScrollRef.current = true;
        el.scrollTop = offsets[initialIndex];
      }
    }

    if (isLoadingPastRef.current) {
      const anchor = pastAnchorRef.current;
      isLoadingPastRef.current = false;
      pastAnchorRef.current = null;
      if (anchor && el) {
        const newIndex = items.findIndex((item) => item.key === anchor.key);
        if (newIndex >= 0) {
          el.scrollTop = offsets[newIndex] + anchor.withinItemOffset;
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, offsets]);

  const handleScroll = useMemo(
    () =>
      raf1(() => {
        const el = scrollElementRef.current;
        if (!el) return;
        recomputeRange(el.scrollTop, el.clientHeight);
        reportVisibleMonth(el.scrollTop);
      }),
    [recomputeRange, reportVisibleMonth],
  );

  useEffect(() => {
    if (!pendingTodayScrollRef.current) return;
    const todayIndex = items.findIndex((item) =>
      isSameMonth(item.month, TODAY),
    );
    if (todayIndex >= 0) {
      pendingTodayScrollRef.current = false;
      const el = scrollElementRef.current;
      if (el) el.scrollTop = offsets[todayIndex];
    }
  }, [items, offsets]);

  const handleJumpToToday = useCallback(() => {
    pendingTodayScrollRef.current = true;
    ensureMonthLoaded(TODAY);
  }, [ensureMonthLoaded]);

  return (
    <div className="schedule-view-wrapper">
      <button
        type="button"
        className="schedule-today-button"
        onClick={handleJumpToToday}
      >
        Today
      </button>
      <div
        className="schedule-view"
        ref={scrollElementRef}
        onScroll={handleScroll}
      >
        <div className="schedule-virtual-space" style={{ height: totalHeight }}>
          <div
            ref={topSentinelRef}
            className="schedule-sentinel"
            style={{ top: 0 }}
          />
          <div
            ref={bottomSentinelRef}
            className="schedule-sentinel"
            style={{ top: totalHeight }}
          />

          <div
            className="schedule-window"
            style={{ transform: `translateY(${offsets[range.start] ?? 0}px)` }}
          >
            {items.slice(range.start, range.end).map((item) => (
              <div
                key={item.key}
                ref={measureItem(item.key)}
                className="schedule-row"
              >
                <MonthBlock
                  month={item.month}
                  events={events}
                  selectedDate={selectedDate}
                  onSelectDay={onSelectDay}
                  onAddEvent={onAddEvent}
                  onViewEvent={onViewEvent}
                  onCloseDetails={onCloseDetails}
                  today={TODAY}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

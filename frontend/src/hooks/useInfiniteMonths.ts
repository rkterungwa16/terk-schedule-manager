import { useCallback, useMemo, useState } from 'react';
import type { LoadDirection } from '../types/calendar.types';
import { addMonths, monthsBetween } from '../utils/dateUtils';

/**
 * Two independent layers make "scroll infinitely without loading very
 * large lists" actually true:
 *
 *  1. THIS hook bounds how many months' worth of data exist in memory at
 *     all. `loadedRange` is a pair of integer month offsets from
 *     `anchorMonth` ({ start: -2, end: 3 } etc). Scrolling near either
 *     edge extends that edge by one month; if the total exceeds
 *     `MAX_LOADED_MONTHS`, the *opposite* edge — the side the user is
 *     scrolling away from — gets trimmed back by one. Trimming is safe
 *     because month data is cheaply regenerable (see useScheduleRows):
 *     nothing is deleted, a trimmed month just isn't part of the row list
 *     until scrolled back into range, at which point it's rebuilt fresh.
 *  2. The DOM/render layer (useVirtualizer in ScheduleView) separately
 *     ensures that even the *currently loaded* months only ever have a
 *     handful of rows actually mounted, regardless of how many months
 *     are loaded. Bounding the data window here keeps the row array itself
 *     — a plain in-memory array, cheap but not free — from growing
 *     without limit over a very long scroll session.
 */
const MAX_LOADED_MONTHS = 24;
const INITIAL_MONTHS_PAST = 1;
const INITIAL_MONTHS_FUTURE = 1;

interface LoadedRange {
  start: number;
  end: number;
}

export function useInfiniteMonths(anchorMonth: Date) {
  const [range, setRange] = useState<LoadedRange>({
    start: -INITIAL_MONTHS_PAST,
    end: INITIAL_MONTHS_FUTURE,
  });

  const months = useMemo(() => {
    const result: Date[] = [];
    for (let offset = range.start; offset <= range.end; offset++) {
      result.push(addMonths(anchorMonth, offset));
    }
    return result;
  }, [anchorMonth, range]);

  /**
   * Extends the window in the given direction, then trims the opposite
   * edge if the window has grown past the cap. Reusing one function for
   * both directions (rather than separate loadPast/loadFuture bodies)
   * keeps the extend-then-trim invariant in one place instead of two
   * near-duplicate implementations that could drift apart.
   */
  const extend = useCallback((direction: LoadDirection) => {
    setRange((prev) => {
      const next =
        direction === 'past' ? { start: prev.start - 1, end: prev.end } : { start: prev.start, end: prev.end + 1 };

      const loadedCount = next.end - next.start + 1;
      if (loadedCount <= MAX_LOADED_MONTHS) return next;

      return direction === 'past'
        ? { start: next.start, end: next.end - 1 }
        : { start: next.start + 1, end: next.end };
    });
  }, []);

  const loadPast = useCallback(() => extend('past'), [extend]);
  const loadFuture = useCallback(() => extend('future'), [extend]);

  /**
   * A direct jump (the "Today" button) rather than a scroll-edge trigger:
   * expands the window just enough to include `target`'s month, regardless
   * of the `MAX_LOADED_MONTHS` cap — a deliberate, explicit user action is
   * a reasonable exception to a limit that otherwise exists to stop
   * *passive* scrolling from accumulating unbounded months.
   */
  const ensureMonthLoaded = useCallback(
    (target: Date) => {
      const offset = monthsBetween(anchorMonth, target);
      setRange((prev) => ({
        start: Math.min(prev.start, offset),
        end: Math.max(prev.end, offset),
      }));
    },
    [anchorMonth]
  );

  return { months, loadPast, loadFuture, ensureMonthLoaded };
}

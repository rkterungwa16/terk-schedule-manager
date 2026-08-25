import { useMemo } from "react";
import type { CalendarEvent } from "../types/calendar.types";
import { dayKey } from "../utils/dateUtils";
import { getOccurringEvents } from "../utils/recurrence";

/**
 * PERFORMANCE NOTE
 * ----------------
 * The previous version of this hook grouped events by their stored `date`
 * once via `groupBy`, giving every day cell an O(1) lookup — safe because
 * each event genuinely lived on exactly one date. Recurrence breaks that
 * assumption: a weekly event doesn't have "a date," it has a pattern that
 * matches many dates, so there's no single key to group it under anymore.
 *
 * This version instead evaluates `eventOccursOnDate` against a specific,
 * *bounded* set of days — the 42 cells of whichever month is on screen,
 * passed in as `days` — rather than the whole (conceptually unbounded, once
 * events can repeat forever) event history. That keeps the cost the same
 * shape as before, O(days × events), which is exactly what the original
 * groupBy approach was written to avoid — but at this scale (a few dozen
 * events, 42 days) it's still comfortably sub-millisecond, and there's no
 * way to precompute a day → events index for a pattern that matches
 * infinitely many days without first deciding which days you care about.
 */
export function useEventsByDay(
  events: CalendarEvent[],
  days: Date[],
): Record<string, CalendarEvent[]> {
  return useMemo(() => {
    const result: Record<string, CalendarEvent[]> = {};
    for (const day of days) {
      result[dayKey(day)] = getOccurringEvents(events, day);
    }
    return result;
  }, [events, days]);
}

export function getEventsForDay(
  eventsByDay: Record<string, CalendarEvent[]>,
  date: Date,
): CalendarEvent[] {
  return eventsByDay[dayKey(date)] ?? [];
}

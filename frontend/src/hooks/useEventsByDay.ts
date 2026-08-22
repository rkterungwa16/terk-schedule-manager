import { useMemo } from 'react';
import type { CalendarEvent } from '../types/calendar.types';
import { groupBy } from '../types/calendar.types';
import { dayKey } from '../utils/dateUtils';

/**
 * PERFORMANCE NOTE
 * ----------------
 * The original vanilla implementation calls `this.events.reduce(...)`
 * *inside* `drawEvents`, which itself runs once per day cell. For a 6-week
 * grid that's 42 full scans of the entire events array per month render —
 * O(days * events).
 *
 * Here we do the grouping exactly once per `events` array identity change,
 * via `useMemo`, using the generic `groupBy` utility from calendar.types.ts.
 * Every day cell then does a single `Map`-style lookup — O(1) — instead of
 * a linear scan. The grid itself becomes O(days + events) instead of
 * O(days * events), which matters more as a user attaches a real calendar
 * feed (hundreds of events) rather than 16 mock entries.
 *
 * `useMemo`'s dependency array is just `[events]`: as long as the parent
 * doesn't create a new `events` array reference on every render (it won't —
 * mock data is generated once via `useState`'s lazy initializer), this
 * computation only re-runs when the underlying event list actually changes.
 */
export function useEventsByDay(events: CalendarEvent[]): Record<string, CalendarEvent[]> {
  return useMemo(() => groupBy(events, (event) => dayKey(event.date)), [events]);
}

export function getEventsForDay(
  eventsByDay: Record<string, CalendarEvent[]>,
  date: Date
): CalendarEvent[] {
  return eventsByDay[dayKey(date)] ?? [];
}

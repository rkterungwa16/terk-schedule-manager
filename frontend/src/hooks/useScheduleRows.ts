import { useMemo } from 'react';
import type { CalendarEvent, ScheduleRow } from '../types/calendar.types';
import { generateMockEvents } from '../data/mockEvents';
import { dayKey, daysInMonth, formatMonthYear, isSameMonth } from '../utils/dateUtils';

/**
 * Builds the flat row list for however many months are currently loaded.
 *
 * Demo data is generated per month on demand via `generateMockEvents(month)`
 * — the same function used to seed Month view — rather than pre-generated
 * for a huge date range up front. That's what makes "scroll infinitely"
 * cheap: there's no upper or lower bound on how far a user can scroll,
 * because nothing is precomputed for months that were never visited.
 *
 * User-added events (held in Calendar's `events` state, which is unbounded
 * and never trimmed — see useInfiniteMonths for what *is* trimmed) are
 * merged in per month by filtering on `isSameMonth`, so an event added
 * for any date — past, present, or future — appears correctly the moment
 * its month scrolls into the loaded window.
 *
 * Every day of the month gets a row — day 1 through `daysInMonth(month)` —
 * not just the days that happen to have an event. A day with none still
 * appears with an empty events list (see ScheduleDayRow's "No events"
 * state); the row list is the full calendar, not a sparse index of only
 * the busy days.
 */
export function useScheduleRows(months: Date[], addedEvents: CalendarEvent[]): ScheduleRow[] {
  return useMemo(() => {
    const rows: ScheduleRow[] = [];

    for (const month of months) {
      const monthAddedEvents = addedEvents.filter((event) => isSameMonth(event.date, month));
      const monthEvents = [...generateMockEvents(month), ...monthAddedEvents];

      const eventsByDay = new Map<number, CalendarEvent[]>();
      for (const event of monthEvents) {
        const day = event.date.getDate();
        const existing = eventsByDay.get(day);
        if (existing) existing.push(event);
        else eventsByDay.set(day, [event]);
      }

      rows.push({
        kind: 'month-divider',
        key: `divider-${dayKey(month)}`,
        label: formatMonthYear(month),
        month,
      });

      const totalDays = daysInMonth(month);
      for (let day = 1; day <= totalDays; day++) {
        const date = new Date(month.getFullYear(), month.getMonth(), day);
        rows.push({
          kind: 'day',
          key: dayKey(date),
          group: { date, events: eventsByDay.get(day) ?? [] },
          month,
        });
      }
    }

    return rows;
  }, [months, addedEvents]);
}

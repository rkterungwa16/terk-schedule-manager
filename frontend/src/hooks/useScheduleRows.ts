import { useMemo } from 'react';
import type { CalendarEvent, ScheduleRow } from '../types/calendar.types';
import { generateMockEvents } from '../data/mockEvents';
import { dayKey, formatMonthYear, isSameMonth } from '../utils/dateUtils';

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
 */
export function useScheduleRows(months: Date[], addedEvents: CalendarEvent[]): ScheduleRow[] {
  return useMemo(() => {
    const rows: ScheduleRow[] = [];

    for (const month of months) {
      const monthAddedEvents = addedEvents.filter((event) => isSameMonth(event.date, month));
      const monthEvents = [...generateMockEvents(month), ...monthAddedEvents];

      const dayGroups = new Map<number, { date: Date; events: CalendarEvent[] }>();
      for (const event of monthEvents) {
        const key = new Date(
          event.date.getFullYear(),
          event.date.getMonth(),
          event.date.getDate()
        ).getTime();
        const existing = dayGroups.get(key);
        if (existing) {
          existing.events.push(event);
        } else {
          dayGroups.set(key, { date: new Date(key), events: [event] });
        }
      }

      const sortedDays = Array.from(dayGroups.values()).sort(
        (a, b) => a.date.getTime() - b.date.getTime()
      );

      // A month with zero events still gets a divider — otherwise scrolling
      // through a quiet month would look identical to a loading glitch,
      // with no indication the app registered that month at all.
      rows.push({ kind: 'month-divider', key: `divider-${dayKey(month)}`, label: formatMonthYear(month) });

      for (const group of sortedDays) {
        rows.push({ kind: 'day', key: dayKey(group.date), group });
      }
    }

    return rows;
  }, [months, addedEvents]);
}

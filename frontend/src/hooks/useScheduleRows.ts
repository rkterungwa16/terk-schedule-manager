import { useMemo } from "react";
import type { ScheduleRow } from "../types/calendar.types";
import type { CalendarEvent } from "../types/calendar.types";
import { dayKey, daysInMonth, formatMonthYear } from "../utils/dateUtils";
import { getOccurringEvents } from "../utils/recurrence";

/**
 * Builds the flat row list for however many months are currently loaded.
 *
 * `events` is now the single, already-combined list — mock templates plus
 * whatever the user has added — evaluated directly via `eventOccursOnDate`
 * for each day. There's no more per-month regeneration step (the old
 * `generateMockEvents(month)` + `isSameMonth` filter): a recurring event
 * doesn't "belong" to the month it was created in, so filtering by month
 * before checking occurrence would incorrectly hide, say, a weekly event
 * from every month except the one its template date happens to fall in.
 * Every event is checked against every day; `eventOccursOnDate` is the
 * function that decides whether it actually shows up there.
 *
 * Every day of the month gets a row — day 1 through `daysInMonth(month)` —
 * not just the days that happen to have an event. A day with none still
 * appears with an empty events list (see ScheduleDayRow's "No events"
 * state); the row list is the full calendar, not a sparse index of only
 * the busy days.
 *
 * `months` is deduplicated by calendar identity (year + month) before
 * building rows — see the comment history in this file's git blame for
 * why that guard exists; it protects this hook regardless of how a repeat
 * upstream might occur.
 */
export function useScheduleRows(
  months: Date[],
  events: CalendarEvent[],
): ScheduleRow[] {
  return useMemo(() => {
    const rows: ScheduleRow[] = [];
    const seenMonths = new Set<string>();

    for (const month of months) {
      const monthKey = `${month.getFullYear()}-${month.getMonth()}`;
      if (seenMonths.has(monthKey)) continue;
      seenMonths.add(monthKey);

      rows.push({
        kind: "month-divider",
        key: `divider-${dayKey(month)}`,
        label: formatMonthYear(month),
        month,
      });

      const totalDays = daysInMonth(month);
      for (let day = 1; day <= totalDays; day++) {
        const date = new Date(month.getFullYear(), month.getMonth(), day);
        rows.push({
          kind: "day",
          key: dayKey(date),
          group: { date, events: getOccurringEvents(events, date) },
          month,
        });
      }
    }

    return rows;
  }, [months, events]);
}

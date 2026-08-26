import type { CalendarEvent } from '../types/calendar.types';
import { assertUnreachable } from '../types/calendar.types';
import { isSameDay } from './dateUtils';

/**
 * A `CalendarEvent` is a *template*, not a list of dates: it stores exactly
 * one date (the first/only occurrence) plus a recurrence rule. Every place
 * that used to ask "does this event live on day X" — the month grid, the
 * schedule list — now asks this function instead, for whichever specific
 * days it actually cares about, rather than the old approach of
 * regenerating a full copy of the event for every month up front.
 *
 * Each recurrence mode only needs to compare the *pattern* (day-of-week,
 * day-of-month, or month-and-day) between the template's date and the
 * candidate date — never construct a hypothetical date to compare against.
 * That sidesteps real calendar edge cases for free: a "monthly" event
 * anchored on the 31st simply doesn't match in a 30-day month (there's no
 * 31st to compare against), and a "yearly" event anchored on Feb 29 simply
 * doesn't match in a non-leap year — both fall out naturally from comparing
 * fields on a real, already-valid `date`, instead of trying to build
 * `new Date(year, 1, 29)` and having it silently roll over to March 1.
 */
export function eventOccursOnDate(event: CalendarEvent, date: Date): boolean {
  // No occurrence before the template's own start date, regardless of
  // recurrence mode — a weekly meeting that "starts" next month doesn't
  // also retroactively appear last month on the same weekday.
  if (date.getTime() < startOfCalendarDay(event.date).getTime()) return false;

  switch (event.recurrence) {
    case 'none':
      return isSameDay(event.date, date);
    case 'daily':
      return true;
    case 'weekly':
      return date.getDay() === event.date.getDay();
    case 'monthly':
      return date.getDate() === event.date.getDate();
    case 'yearly':
      return date.getMonth() === event.date.getMonth() && date.getDate() === event.date.getDate();
    default:
      return assertUnreachable(event.recurrence);
  }
}

function startOfCalendarDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/** All events (from `events`) that occur on `date`, per `eventOccursOnDate`. */
export function getOccurringEvents(events: CalendarEvent[], date: Date): CalendarEvent[] {
  return events.filter((event) => eventOccursOnDate(event, date));
}

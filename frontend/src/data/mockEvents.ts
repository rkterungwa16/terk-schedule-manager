import type { CalendarCategory, CalendarEvent } from '../types/calendar.types';
import { CATEGORY_COLOR_MAP } from '../types/calendar.types';

interface RawEvent {
  eventName: string;
  calendar: CalendarCategory;
  dayOfMonth: number;
}

const RAW_EVENTS: RawEvent[] = [
  { eventName: 'Lunch Meeting w/ Mark', calendar: 'Work', dayOfMonth: 3 },
  { eventName: 'Interview - Jr. Web Developer', calendar: 'Work', dayOfMonth: 8 },
  { eventName: 'Demo New App to the Board', calendar: 'Work', dayOfMonth: 8 },
  { eventName: 'Dinner w/ Marketing', calendar: 'Work', dayOfMonth: 21 },

  { eventName: 'Game vs Portland', calendar: 'Sports', dayOfMonth: 5 },
  { eventName: 'Game vs Houston', calendar: 'Sports', dayOfMonth: 12 },
  { eventName: 'Game vs Denver', calendar: 'Sports', dayOfMonth: 19 },
  { eventName: 'Game vs San Diego', calendar: 'Sports', dayOfMonth: 26 },

  { eventName: 'School Play', calendar: 'Kids', dayOfMonth: 8 },
  { eventName: 'Parent/Teacher Conference', calendar: 'Kids', dayOfMonth: 14 },
  { eventName: 'Pick up from Soccer Practice', calendar: 'Kids', dayOfMonth: 14 },
  { eventName: 'Ice Cream Night', calendar: 'Kids', dayOfMonth: 22 },

  { eventName: 'Free Tamale Night', calendar: 'Other', dayOfMonth: 2 },
  { eventName: 'Bowling Team', calendar: 'Other', dayOfMonth: 11 },
  { eventName: 'Teach Kids to Code', calendar: 'Other', dayOfMonth: 17 },
  { eventName: 'Startup Weekend', calendar: 'Other', dayOfMonth: 27 },
];

/**
 * Builds mock events anchored to whatever month is passed in, so the demo
 * data always has something to show regardless of which month the user
 * navigates to on first load. In a real app this function is replaced by
 * a fetch/query hook — everything downstream only depends on the
 * `CalendarEvent[]` shape, not on how it was produced.
 */
export function generateMockEvents(monthAnchor: Date): CalendarEvent[] {
  const year = monthAnchor.getFullYear();
  const month = monthAnchor.getMonth();

  return RAW_EVENTS.map((raw, index) => ({
    id: `${year}-${month}-${index}`,
    eventName: raw.eventName,
    calendar: raw.calendar,
    color: CATEGORY_COLOR_MAP[raw.calendar],
    date: new Date(year, month, raw.dayOfMonth),
  }));
}

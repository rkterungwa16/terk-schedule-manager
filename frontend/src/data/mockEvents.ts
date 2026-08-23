import type { CalendarEvent } from '../types/calendar.types';

/**
 * Anchored relative to whenever the app happens to load, so the demo data
 * always feels current regardless of when that is — the same intent the
 * old per-month generator had, just accomplished through real recurrence
 * now instead of regenerating a copy of every event for whatever month was
 * asked about. Each entry below is a genuine template: one true start
 * date, one recurrence rule, and `eventOccursOnDate` (utils/recurrence.ts)
 * decides which days it actually shows up on — including days in months
 * that were never explicitly "generated," past or future alike.
 */
const TODAY = new Date();

function daysFromToday(offset: number): Date {
  return new Date(TODAY.getFullYear(), TODAY.getMonth(), TODAY.getDate() + offset);
}

interface MockEventSeed {
  eventName: string;
  categoryId: string;
  daysOffset: number;
  startTime: string;
  endTime: string;
  recurrence: CalendarEvent['recurrence'];
}

const SEEDS: MockEventSeed[] = [
  { eventName: 'Lunch Meeting w/ Mark', categoryId: 'work', daysOffset: -2, startTime: '12:00', endTime: '13:00', recurrence: 'none' },
  { eventName: 'Interview - Jr. Web Developer', categoryId: 'work', daysOffset: 3, startTime: '10:00', endTime: '11:00', recurrence: 'none' },
  { eventName: 'Weekly Team Standup', categoryId: 'work', daysOffset: -30, startTime: '09:00', endTime: '09:15', recurrence: 'weekly' },
  { eventName: 'Demo New App to the Board', categoryId: 'work', daysOffset: -15, startTime: '14:00', endTime: '15:00', recurrence: 'monthly' },

  { eventName: 'Game vs Portland', categoryId: 'sports', daysOffset: 5, startTime: '19:00', endTime: '21:00', recurrence: 'none' },
  { eventName: 'Weekly Soccer Practice', categoryId: 'sports', daysOffset: -14, startTime: '17:00', endTime: '18:30', recurrence: 'weekly' },

  { eventName: 'School Play', categoryId: 'kids', daysOffset: 8, startTime: '18:00', endTime: '19:30', recurrence: 'none' },
  { eventName: 'Parent/Teacher Conference', categoryId: 'kids', daysOffset: -20, startTime: '16:00', endTime: '16:30', recurrence: 'monthly' },
  { eventName: 'Morning Walk', categoryId: 'kids', daysOffset: -10, startTime: '07:00', endTime: '07:30', recurrence: 'daily' },

  { eventName: 'Free Tamale Night', categoryId: 'other', daysOffset: 2, startTime: '18:00', endTime: '20:00', recurrence: 'none' },
  { eventName: 'Bowling Team', categoryId: 'other', daysOffset: -21, startTime: '19:00', endTime: '21:00', recurrence: 'weekly' },
  { eventName: 'Company Anniversary', categoryId: 'other', daysOffset: -100, startTime: '12:00', endTime: '13:00', recurrence: 'yearly' },
];

export const MOCK_EVENTS: CalendarEvent[] = SEEDS.map((seed, index) => ({
  id: `mock-${index}`,
  eventName: seed.eventName,
  categoryId: seed.categoryId,
  date: daysFromToday(seed.daysOffset),
  startTime: seed.startTime,
  endTime: seed.endTime,
  recurrence: seed.recurrence,
}));

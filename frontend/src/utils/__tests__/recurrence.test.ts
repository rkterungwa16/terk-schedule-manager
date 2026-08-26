import type { CalendarEvent } from '../../types/calendar.types';
import { eventOccursOnDate, getOccurringEvents } from '../recurrence';

function makeEvent(overrides: Partial<CalendarEvent> = {}): CalendarEvent {
  return {
    id: 'test-event',
    eventName: 'Test Event',
    categoryId: 'work',
    date: new Date(2026, 7, 25), // Tuesday, Aug 25 2026
    startTime: '09:00',
    endTime: '10:00',
    recurrence: 'none',
    ...overrides,
  };
}

describe('eventOccursOnDate: none', () => {
  it('matches only the exact date', () => {
    const event = makeEvent({ recurrence: 'none' });
    expect(eventOccursOnDate(event, new Date(2026, 7, 25))).toBe(true);
    expect(eventOccursOnDate(event, new Date(2026, 7, 26))).toBe(false);
  });

  it('ignores time-of-day when comparing', () => {
    const event = makeEvent({ recurrence: 'none', date: new Date(2026, 7, 25, 9, 0) });
    expect(eventOccursOnDate(event, new Date(2026, 7, 25, 23, 59))).toBe(true);
  });
});

describe('eventOccursOnDate: daily', () => {
  it('matches every day on or after the start date', () => {
    const event = makeEvent({ recurrence: 'daily', date: new Date(2026, 7, 25) });
    expect(eventOccursOnDate(event, new Date(2026, 7, 25))).toBe(true);
    expect(eventOccursOnDate(event, new Date(2026, 7, 26))).toBe(true);
    expect(eventOccursOnDate(event, new Date(2027, 2, 3))).toBe(true);
  });

  it('never matches before the start date', () => {
    const event = makeEvent({ recurrence: 'daily', date: new Date(2026, 7, 25) });
    expect(eventOccursOnDate(event, new Date(2026, 7, 24))).toBe(false);
  });
});

describe('eventOccursOnDate: weekly', () => {
  it('matches the same day-of-week on or after the start date', () => {
    // Aug 25 2026 is a Tuesday.
    const event = makeEvent({ recurrence: 'weekly', date: new Date(2026, 7, 25) });
    expect(eventOccursOnDate(event, new Date(2026, 8, 1))).toBe(true); // next Tuesday
    expect(eventOccursOnDate(event, new Date(2026, 8, 8))).toBe(true); // the Tuesday after
  });

  it('does not match a different day-of-week', () => {
    const event = makeEvent({ recurrence: 'weekly', date: new Date(2026, 7, 25) });
    expect(eventOccursOnDate(event, new Date(2026, 8, 2))).toBe(false); // that Wednesday
  });

  it('does not match the same weekday before the start date', () => {
    const event = makeEvent({ recurrence: 'weekly', date: new Date(2026, 7, 25) });
    expect(eventOccursOnDate(event, new Date(2026, 7, 18))).toBe(false); // Tuesday, one week earlier
  });
});

describe('eventOccursOnDate: monthly', () => {
  it('matches the same day-of-month in later months', () => {
    const event = makeEvent({ recurrence: 'monthly', date: new Date(2026, 6, 8) });
    expect(eventOccursOnDate(event, new Date(2026, 7, 8))).toBe(true);
    expect(eventOccursOnDate(event, new Date(2026, 9, 8))).toBe(true);
  });

  it('does not match a different day-of-month', () => {
    const event = makeEvent({ recurrence: 'monthly', date: new Date(2026, 6, 8) });
    expect(eventOccursOnDate(event, new Date(2026, 7, 9))).toBe(false);
  });

  it('naturally skips months with no matching day, with no special-casing', () => {
    // Anchored on the 31st — April, June, September, November have no 31st
    // day at all, so there is simply no date in those months this could
    // ever match against; it isn't skipped by an explicit rule, there's
    // nothing to compare true against.
    const event = makeEvent({ recurrence: 'monthly', date: new Date(2026, 0, 31) });
    expect(eventOccursOnDate(event, new Date(2026, 3, 30))).toBe(false); // April 30, not 31
    expect(eventOccursOnDate(event, new Date(2026, 2, 31))).toBe(true); // March 31 exists
  });
});

describe('eventOccursOnDate: yearly', () => {
  it('matches the same month and day in later years', () => {
    const event = makeEvent({ recurrence: 'yearly', date: new Date(2026, 4, 15) });
    expect(eventOccursOnDate(event, new Date(2027, 4, 15))).toBe(true);
    expect(eventOccursOnDate(event, new Date(2030, 4, 15))).toBe(true);
  });

  it('does not match the same day in a different month', () => {
    const event = makeEvent({ recurrence: 'yearly', date: new Date(2026, 4, 15) });
    expect(eventOccursOnDate(event, new Date(2027, 5, 15))).toBe(false);
  });

  it('naturally skips non-leap years for a Feb 29 anchor', () => {
    const event = makeEvent({ recurrence: 'yearly', date: new Date(2024, 1, 29) }); // 2024 is a leap year
    expect(eventOccursOnDate(event, new Date(2025, 1, 28))).toBe(false); // no Feb 29 in 2025
    expect(eventOccursOnDate(event, new Date(2028, 1, 29))).toBe(true); // 2028 is a leap year
  });
});

describe('getOccurringEvents', () => {
  it('returns only the events that occur on the given date', () => {
    const matching = makeEvent({ id: 'a', recurrence: 'none', date: new Date(2026, 7, 25) });
    const notMatching = makeEvent({ id: 'b', recurrence: 'none', date: new Date(2026, 7, 26) });
    const result = getOccurringEvents([matching, notMatching], new Date(2026, 7, 25));
    expect(result).toEqual([matching]);
  });

  it('returns an empty array when nothing matches', () => {
    const event = makeEvent({ recurrence: 'none', date: new Date(2026, 7, 25) });
    expect(getOccurringEvents([event], new Date(2026, 7, 26))).toEqual([]);
  });
});

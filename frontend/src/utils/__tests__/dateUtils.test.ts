import {
  addDays,
  addMonths,
  buildMonthGrid,
  daysInMonth,
  dayKey,
  endOfMonth,
  formatFullDate,
  formatMonthYear,
  formatTimeLabel,
  isSameDay,
  isSameMonth,
  monthsBetween,
  startOfMonth,
} from '../dateUtils';

describe('startOfMonth / endOfMonth', () => {
  it('returns the 1st of the month, time-of-day stripped', () => {
    const result = startOfMonth(new Date(2026, 7, 15, 13, 45));
    expect(result.getFullYear()).toBe(2026);
    expect(result.getMonth()).toBe(7);
    expect(result.getDate()).toBe(1);
  });

  it('returns the last real day of the month, handling variable month length', () => {
    expect(endOfMonth(new Date(2026, 1, 10)).getDate()).toBe(28); // Feb 2026, non-leap
    expect(endOfMonth(new Date(2024, 1, 10)).getDate()).toBe(29); // Feb 2024, leap
    expect(endOfMonth(new Date(2026, 3, 10)).getDate()).toBe(30); // April
  });
});

describe('daysInMonth', () => {
  it("matches endOfMonth's date for several month lengths", () => {
    expect(daysInMonth(new Date(2026, 0, 1))).toBe(31); // Jan
    expect(daysInMonth(new Date(2026, 1, 1))).toBe(28); // Feb, non-leap
    expect(daysInMonth(new Date(2024, 1, 1))).toBe(29); // Feb, leap
    expect(daysInMonth(new Date(2026, 3, 1))).toBe(30); // Apr
  });
});

describe('addMonths', () => {
  it('adds a positive offset, rolling over into the next year', () => {
    const result = addMonths(new Date(2026, 10, 15), 3); // Nov 2026 + 3
    expect(result.getFullYear()).toBe(2027);
    expect(result.getMonth()).toBe(1); // Feb
  });

  it('adds a negative offset, rolling back into the previous year', () => {
    const result = addMonths(new Date(2026, 1, 15), -3); // Feb 2026 - 3
    expect(result.getFullYear()).toBe(2025);
    expect(result.getMonth()).toBe(10); // Nov
  });

  it('always normalizes to the 1st of the resulting month', () => {
    const result = addMonths(new Date(2026, 7, 25), 1);
    expect(result.getDate()).toBe(1);
  });
});

describe('monthsBetween', () => {
  it('is 0 for the same month', () => {
    expect(monthsBetween(new Date(2026, 7, 1), new Date(2026, 7, 28))).toBe(0);
  });

  it('is positive when b is after a, across a year boundary', () => {
    expect(monthsBetween(new Date(2026, 10, 1), new Date(2027, 1, 1))).toBe(3);
  });

  it('is negative when b is before a', () => {
    expect(monthsBetween(new Date(2026, 7, 1), new Date(2026, 4, 1))).toBe(-3);
  });
});

describe('addDays', () => {
  it('does not mutate the input date', () => {
    const original = new Date(2026, 7, 25);
    const originalTime = original.getTime();
    addDays(original, 5);
    expect(original.getTime()).toBe(originalTime);
  });

  it('rolls over into the next month correctly', () => {
    const result = addDays(new Date(2026, 7, 30), 3);
    expect(result.getMonth()).toBe(8); // September
    expect(result.getDate()).toBe(2);
  });
});

describe('isSameDay / isSameMonth', () => {
  it('isSameDay ignores time-of-day', () => {
    expect(isSameDay(new Date(2026, 7, 25, 1, 0), new Date(2026, 7, 25, 23, 59))).toBe(true);
  });

  it('isSameDay is false for different days', () => {
    expect(isSameDay(new Date(2026, 7, 25), new Date(2026, 7, 26))).toBe(false);
  });

  it('isSameMonth ignores the day-of-month', () => {
    expect(isSameMonth(new Date(2026, 7, 1), new Date(2026, 7, 31))).toBe(true);
  });

  it('isSameMonth is false across a year boundary even if the month number matches', () => {
    expect(isSameMonth(new Date(2025, 7, 1), new Date(2026, 7, 1))).toBe(false);
  });
});

describe('dayKey', () => {
  it('produces a stable, distinct key per calendar day', () => {
    expect(dayKey(new Date(2026, 7, 25))).toBe('2026-7-25');
    expect(dayKey(new Date(2026, 7, 25))).not.toBe(dayKey(new Date(2026, 7, 26)));
  });
});

describe('formatTimeLabel', () => {
  it('formats morning times with AM', () => {
    expect(formatTimeLabel('09:00')).toBe('9:00 AM');
  });

  it('formats afternoon times with PM', () => {
    expect(formatTimeLabel('13:30')).toBe('1:30 PM');
  });

  it('formats midnight as 12:00 AM', () => {
    expect(formatTimeLabel('00:00')).toBe('12:00 AM');
  });

  it('formats noon as 12:00 PM', () => {
    expect(formatTimeLabel('12:00')).toBe('12:00 PM');
  });

  it('falls back to the raw string for unparseable input', () => {
    expect(formatTimeLabel('not-a-time')).toBe('not-a-time');
  });
});

describe('formatMonthYear / formatFullDate', () => {
  it('formatMonthYear reads "Month YYYY"', () => {
    expect(formatMonthYear(new Date(2026, 7, 1))).toBe('August 2026');
  });

  it('formatFullDate includes weekday, month, day, and year', () => {
    const label = formatFullDate(new Date(2026, 7, 25));
    expect(label).toContain('2026');
    expect(label).toContain('August');
    expect(label).toContain('25');
  });
});

describe('buildMonthGrid', () => {
  it('always returns a whole number of weeks (multiple of 7)', () => {
    const grid = buildMonthGrid(new Date(2026, 7, 1));
    expect(grid.length % 7).toBe(0);
  });

  it('starts on a Sunday and ends on a Saturday', () => {
    const grid = buildMonthGrid(new Date(2026, 7, 1));
    expect(grid[0].getDay()).toBe(0);
    expect(grid[grid.length - 1].getDay()).toBe(6);
  });

  it('includes every real day of the target month', () => {
    const grid = buildMonthGrid(new Date(2026, 7, 1)); // August 2026, 31 days
    const daysInAugust = grid.filter((d) => d.getMonth() === 7 && d.getFullYear() === 2026);
    expect(daysInAugust).toHaveLength(31);
  });
});

/**
 * Pure date-math helpers built on the native `Date` API (no moment.js, per
 * the requirement). Kept as small, pure, easily-memoizable functions —
 * every function here is a candidate for `useMemo` because none of them
 * mutate their input and all of them are cheap to re-run but still worth
 * caching if called on every render.
 */

/** Returns a *new* Date set to the 1st of the given date's month. */
export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

/** Returns a *new* Date set to the last day of the given date's month. */
export function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

/** Number of days in the given date's month (28-31). */
export function daysInMonth(date: Date): number {
  return endOfMonth(date).getDate();
}

export function addMonths(date: Date, amount: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

/** Integer number of calendar months from `a` to `b` (can be negative). */
export function monthsBetween(a: Date, b: Date): number {
  return (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth());
}

export function addDays(date: Date, amount: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function isSameMonth(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

/**
 * Stable, timezone-safe key for grouping events by calendar day.
 * Using this (rather than `date.toDateString()` or an ISO string sliced to
 * 10 chars) keeps the grouping logic in one place and easy to change.
 */
export function dayKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

export function formatMonthYear(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export function formatDayName(date: Date): string {
  return date.toLocaleDateString('en-US', { weekday: 'short' });
}

export function formatDayNumber(date: Date): string {
  return date.toLocaleDateString('en-US', { day: '2-digit' });
}

/**
 * Formats a Date as the `yyyy-mm-dd` string an `<input type="date">`
 * expects for its `value`. Deliberately built from local getters (not
 * `toISOString`, which converts to UTC and can shift the date by a day
 * depending on the user's timezone offset).
 */
export function toInputDateValue(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/** Inverse of toInputDateValue — parses the browser's `yyyy-mm-dd` value
 *  back into a local Date (again avoiding UTC-parsing pitfalls of
 *  `new Date('yyyy-mm-dd')`, which parses as UTC midnight). */
export function fromInputDateValue(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const [, year, month, day] = match;
  return new Date(Number(year), Number(month) - 1, Number(day));
}

/**
 * Builds the full 6-week grid (leading/trailing days from adjacent months
 * included) for whatever month `anchor` falls in — a direct TS translation
 * of the original backFill/currentMonth/forwardFill trio, but as one pure
 * function returning a flat array instead of three methods that mutate DOM
 * nodes as a side effect.
 */
export function buildMonthGrid(anchor: Date): Date[] {
  const first = startOfMonth(anchor);
  const last = endOfMonth(anchor);

  // Sunday = 0 ... Saturday = 6. Walk backwards to the start of that week.
  const leadingDays = first.getDay();
  const gridStart = addDays(first, -leadingDays);

  // Pad forward so the grid always ends on a Saturday, completing the week.
  const trailingDays = 6 - last.getDay();
  const gridEnd = addDays(last, trailingDays);

  const days: Date[] = [];
  for (let d = gridStart; d <= gridEnd; d = addDays(d, 1)) {
    days.push(d);
  }
  return days;
}

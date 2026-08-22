import type { CalendarEventInput, EventFormResult } from '../types/calendar.types';
import { isCalendarCategory } from '../types/calendar.types';
import { fromInputDateValue } from './dateUtils';

/**
 * The raw, untyped shape coming straight out of form inputs — every field
 * is a `string` because that's what the DOM gives you, regardless of what
 * it's supposed to represent semantically.
 */
export interface RawEventFormValues {
  eventName: string;
  /** Not yet known to be a `CalendarCategory` — validated below. */
  calendar: string;
  /** `yyyy-mm-dd`, the native format of `<input type="date">`. */
  dateString: string;
}

/**
 * Validates raw form input and returns a `Result<CalendarEventInput>`.
 * Returning a discriminated union here (rather than throwing, or returning
 * `CalendarEventInput | null`) means the caller is forced by the type
 * checker to handle both branches explicitly — `result.value` is only
 * accessible once `result.ok` has been checked, and the error message
 * travels with the failure instead of being reconstructed at the call site.
 */
export function validateEventForm(raw: RawEventFormValues): EventFormResult {
  const eventName = raw.eventName.trim();
  if (!eventName) {
    return { ok: false, error: 'Event name is required.' };
  }

  // `isCalendarCategory` narrows `raw.calendar` from `string` to
  // `CalendarCategory` — without it, `calendar` below would still be typed
  // as the wide `string` and couldn't be assigned into CalendarEventInput.
  if (!isCalendarCategory(raw.calendar)) {
    return { ok: false, error: 'Choose a calendar.' };
  }

  const date = fromInputDateValue(raw.dateString);
  if (!date) {
    return { ok: false, error: 'Pick a valid date.' };
  }

  const value: CalendarEventInput = {
    eventName,
    calendar: raw.calendar,
    date,
  };

  return { ok: true, value };
}

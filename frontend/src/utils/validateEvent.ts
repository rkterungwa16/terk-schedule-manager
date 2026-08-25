import type {
  CalendarEventInput,
  EventCategory,
  EventFormResult,
} from "../types/calendar.types";
import { isRecurrenceFrequency } from "../types/calendar.types";

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

/**
 * The raw, untyped shape coming straight out of form inputs — every field
 * is a `string` because that's what the DOM gives you, regardless of what
 * it's supposed to represent semantically. Notably absent: a date field.
 * The date isn't something this form lets the user choose (see
 * AddEventForm's comment on why there's no date picker) — it's fixed by
 * whichever day the user clicked before the modal ever opened, so it's
 * passed into `validateEventForm` directly rather than collected here.
 */
export interface RawEventFormValues {
  eventName: string;
  /** Not yet known to reference a real category — validated below against
   *  whatever categories currently exist. */
  categoryId: string;
  /** "HH:MM", 24-hour — the native value of `<input type="time">`. */
  startTime: string;
  endTime: string;
  /** Not yet known to be a `RecurrenceFrequency` — validated below. */
  recurrence: string;
}

/**
 * Validates raw form input and returns a `Result<CalendarEventInput>`.
 * Returning a discriminated union here (rather than throwing, or returning
 * `CalendarEventInput | null`) means the caller is forced by the type
 * checker to handle both branches explicitly — `result.value` is only
 * accessible once `result.ok` has been checked, and the error message
 * travels with the failure instead of being reconstructed at the call site.
 *
 * `categories` and `date` are passed in as data (not part of `raw`)
 * because neither is something the form itself collects: `date` is fixed
 * before the form opens, and `categories` is read from Context — this
 * function just needs both to actually validate `raw.categoryId` and
 * assemble the final event.
 */
export function validateEventForm(
  raw: RawEventFormValues,
  date: Date,
  categories: EventCategory[],
): EventFormResult {
  const eventName = raw.eventName.trim();
  if (!eventName) {
    return { ok: false, error: "Event name is required." };
  }

  // Category membership is a runtime check now, not a type guard — the set
  // of valid ids isn't closed at compile time once categories are
  // user-extensible (see calendar.types.ts section 1).
  if (!categories.some((category) => category.id === raw.categoryId)) {
    return { ok: false, error: "Choose a category." };
  }

  if (!TIME_PATTERN.test(raw.startTime) || !TIME_PATTERN.test(raw.endTime)) {
    return { ok: false, error: "Pick a start and end time." };
  }
  if (raw.endTime <= raw.startTime) {
    // "HH:MM" strings compare correctly with plain string comparison —
    // zero-padded 24-hour values sort lexicographically the same way they
    // sort chronologically, so no parsing is needed just to order them.
    return { ok: false, error: "End time must be after start time." };
  }

  if (!isRecurrenceFrequency(raw.recurrence)) {
    return { ok: false, error: "Choose how often this repeats." };
  }

  const value: CalendarEventInput = {
    eventName,
    categoryId: raw.categoryId,
    date,
    startTime: raw.startTime,
    endTime: raw.endTime,
    recurrence: raw.recurrence,
  };

  return { ok: true, value };
}

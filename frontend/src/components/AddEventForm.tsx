import { useId, useState, type FormEvent } from 'react';
import type { CalendarCategory, CalendarEventInput } from '../types/calendar.types';
import { CATEGORY_COLOR_MAP } from '../types/calendar.types';
import { toInputDateValue } from '../utils/dateUtils';
import { validateEventForm } from '../utils/validateEvent';

/**
 * `Object.keys` on the `as const` map, cast back to `CalendarCategory[]`.
 * `Object.keys` widens to `string[]` at the type level (it can't statically
 * know the object has no extra keys at runtime), so the cast is a deliberate,
 * narrow escape hatch — safe here specifically because CATEGORY_COLOR_MAP's
 * keys *are* CalendarCategory by construction (see calendar.types.ts).
 */
const CATEGORIES = Object.keys(CATEGORY_COLOR_MAP) as CalendarCategory[];

interface AddEventFormProps {
  /** Pre-fills the date field — e.g. the currently-selected day. */
  initialDate: Date;
  onSubmit: (input: CalendarEventInput) => void;
  onCancel: () => void;
}

export function AddEventForm({ initialDate, onSubmit, onCancel }: AddEventFormProps) {
  // useId: generates stable, unique ids for label/input pairing that are
  // also safe under React StrictMode's double-invoke and won't collide if
  // this form is ever rendered more than once on the same page.
  const nameId = useId();
  const calendarId = useId();
  const dateId = useId();

  const [eventName, setEventName] = useState('');
  const [calendar, setCalendar] = useState<CalendarCategory>('Work');
  const [dateString, setDateString] = useState(() => toInputDateValue(initialDate));
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    // `validateEventForm` returns a Result<CalendarEventInput>. TypeScript
    // won't let us read `result.value` until we've checked `result.ok` —
    // the discriminated union makes "used an unvalidated value" a compile
    // error rather than a bug found in production.
    const result = validateEventForm({ eventName, calendar, dateString });

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setError(null);
    onSubmit(result.value);
  }

  return (
    <form className="add-event-form" onSubmit={handleSubmit}>
      <h2>Add Event</h2>

      <div className="field">
        <label htmlFor={nameId}>Event name</label>
        <input
          id={nameId}
          type="text"
          value={eventName}
          onChange={(event) => setEventName(event.target.value)}
          placeholder="e.g. Lunch with Mark"
          autoFocus
        />
      </div>

      <div className="field">
        <label htmlFor={calendarId}>Calendar</label>
        <select
          id={calendarId}
          value={calendar}
          onChange={(event) => setCalendar(event.target.value as CalendarCategory)}
        >
          {CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label htmlFor={dateId}>Date</label>
        <input
          id={dateId}
          type="date"
          value={dateString}
          onChange={(event) => setDateString(event.target.value)}
        />
      </div>

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      <div className="form-actions">
        <button type="button" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit">Add Event</button>
      </div>
    </form>
  );
}

import { useState, type FormEvent } from "react";
import type {
  CalendarEventInput,
  RecurrenceFrequency,
} from "../types/calendar.types";
import { validateEventForm } from "../utils/validateEvent";
import { useCategories } from "../context/CategoriesContext";
import { EventFields } from "./EventFields";

interface AddEventFormProps {
  /** Fixed, not editable in this form — whichever day the user clicked
   *  before the modal opened. */
  initialDate: Date;
  onSubmit: (input: CalendarEventInput) => void;
  onCancel: () => void;
}

export function AddEventForm({
  initialDate,
  onSubmit,
  onCancel,
}: AddEventFormProps) {
  const { categories } = useCategories();

  const [eventName, setEventName] = useState("");
  const [categoryId, setCategoryId] = useState(() => categories[0]?.id ?? "");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [recurrence, setRecurrence] = useState<RecurrenceFrequency>("none");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    // `validateEventForm` returns a Result<CalendarEventInput>. TypeScript
    // won't let us read `result.value` until we've checked `result.ok` —
    // the discriminated union makes "used an unvalidated value" a compile
    // error rather than a bug found in production.
    const result = validateEventForm(
      { eventName, categoryId, startTime, endTime, recurrence },
      initialDate,
      categories,
    );

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

      <EventFields
        eventName={eventName}
        onEventNameChange={setEventName}
        date={initialDate}
        startTime={startTime}
        onStartTimeChange={setStartTime}
        endTime={endTime}
        onEndTimeChange={setEndTime}
        recurrence={recurrence}
        onRecurrenceChange={setRecurrence}
        categoryId={categoryId}
        onCategoryChange={setCategoryId}
      />

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

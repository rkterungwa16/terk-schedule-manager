import { useState, type FormEvent } from 'react';
import type {
  CalendarEvent,
  CalendarEventInput,
  RecurrenceFrequency,
} from '../types/calendar.types';
import { validateEventForm } from '../utils/validateEvent';
import { useCategories } from '../context/CategoriesContext';
import { EventFields } from './EventFields';

interface EditEventFormProps {
  event: CalendarEvent;
  onSave: (id: string, input: CalendarEventInput) => void;
  onCancel: () => void;
}

/**
 * The date is pre-filled from `event.date` and, like AddEventForm, stays
 * read-only — moving an event to a different day isn't in scope here
 * (that would need some way to pick a date, which is exactly the calendar
 * picker this app deliberately doesn't have in any modal). What's
 * editable is everything else: name, time, recurrence, category.
 */
export function EditEventForm({ event, onSave, onCancel }: EditEventFormProps) {
  const { categories } = useCategories();

  const [eventName, setEventName] = useState(event.eventName);
  const [categoryId, setCategoryId] = useState(event.categoryId);
  const [startTime, setStartTime] = useState(event.startTime);
  const [endTime, setEndTime] = useState(event.endTime);
  const [recurrence, setRecurrence] = useState<RecurrenceFrequency>(event.recurrence);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(formEvent: FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();

    const result = validateEventForm(
      { eventName, categoryId, startTime, endTime, recurrence },
      event.date,
      categories
    );

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setError(null);
    onSave(event.id, result.value);
  }

  return (
    <form className="add-event-form" onSubmit={handleSubmit}>
      <h2>Event Details</h2>

      <EventFields
        eventName={eventName}
        onEventNameChange={setEventName}
        date={event.date}
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
        <button type="submit">Save Changes</button>
      </div>
    </form>
  );
}

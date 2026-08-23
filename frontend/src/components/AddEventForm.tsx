import { useId, useState, type FormEvent } from 'react';
import type { CalendarEventInput, RecurrenceFrequency } from '../types/calendar.types';
import { formatFullDate } from '../utils/dateUtils';
import { validateEventForm } from '../utils/validateEvent';
import { useCategories } from '../context/CategoriesContext';
import { CATEGORY_COLOR_PALETTE } from '../data/categories';

const RECURRENCE_OPTIONS: { value: RecurrenceFrequency; label: string }[] = [
  { value: 'none', label: 'Does not repeat' },
  { value: 'daily', label: 'Every day' },
  { value: 'weekly', label: 'Every week' },
  { value: 'monthly', label: 'Every month' },
  { value: 'yearly', label: 'Every year' },
];

/** Sentinel option value that opens the inline "new category" fields,
 *  rather than being a real category id — kept as a distinct constant
 *  (not a magic string re-typed in two places) so the select's onChange
 *  and the JSX option share exactly one source of truth for it. */
const NEW_CATEGORY_OPTION = '__new_category__';

interface AddEventFormProps {
  /** Fixed, not editable in this form — whichever day the user clicked
   *  before the modal opened. See the note above the date field below for
   *  why there's no date picker here at all. */
  initialDate: Date;
  onSubmit: (input: CalendarEventInput) => void;
  onCancel: () => void;
}

export function AddEventForm({ initialDate, onSubmit, onCancel }: AddEventFormProps) {
  const { categories, addCategory } = useCategories();

  // useId: generates stable, unique ids for label/input pairing that are
  // also safe under React StrictMode's double-invoke and won't collide if
  // this form is ever rendered more than once on the same page.
  const nameId = useId();
  const categoryId = useId();
  const startTimeId = useId();
  const endTimeId = useId();
  const recurrenceId = useId();
  const newCategoryNameId = useId();

  const [eventName, setEventName] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState(() => categories[0]?.id ?? '');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [recurrence, setRecurrence] = useState<RecurrenceFrequency>('none');
  const [error, setError] = useState<string | null>(null);

  // Inline "create a category" sub-form, shown in place of (not on top of)
  // the normal category select when its sentinel option is chosen — no
  // second modal, no calendar-style popover, just the same field area
  // switching what it shows.
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState(CATEGORY_COLOR_PALETTE[0]);

  function handleCategoryChange(value: string) {
    if (value === NEW_CATEGORY_OPTION) {
      setIsCreatingCategory(true);
      return;
    }
    setSelectedCategoryId(value);
  }

  function handleCreateCategory() {
    const name = newCategoryName.trim();
    if (!name) return;
    const created = addCategory(name, newCategoryColor);
    setSelectedCategoryId(created.id);
    setIsCreatingCategory(false);
    setNewCategoryName('');
    setNewCategoryColor(CATEGORY_COLOR_PALETTE[0]);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    // `validateEventForm` returns a Result<CalendarEventInput>. TypeScript
    // won't let us read `result.value` until we've checked `result.ok` —
    // the discriminated union makes "used an unvalidated value" a compile
    // error rather than a bug found in production.
    const result = validateEventForm(
      { eventName, categoryId: selectedCategoryId, startTime, endTime, recurrence },
      initialDate,
      categories
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

      {/* Deliberately not an <input type="date"> or any other date picker
          — the date is fixed to whichever day the user clicked in the
          grid (or "+ Add event" from an open day's details) before this
          modal ever opened. Showing it as plain read-only text, rather
          than a disabled input, makes it visually obvious it isn't
          something to interact with here. */}
      <div className="field">
        <span className="field-label">Date</span>
        <p className="field-static-value">{formatFullDate(initialDate)}</p>
      </div>

      <div className="field-row">
        <div className="field">
          <label htmlFor={startTimeId}>Start time</label>
          <input
            id={startTimeId}
            type="time"
            value={startTime}
            onChange={(event) => setStartTime(event.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor={endTimeId}>End time</label>
          <input
            id={endTimeId}
            type="time"
            value={endTime}
            onChange={(event) => setEndTime(event.target.value)}
          />
        </div>
      </div>

      <div className="field">
        <label htmlFor={recurrenceId}>Repeat</label>
        <select
          id={recurrenceId}
          value={recurrence}
          onChange={(event) => setRecurrence(event.target.value as RecurrenceFrequency)}
        >
          {RECURRENCE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label htmlFor={categoryId}>Category</label>
        {!isCreatingCategory && (
          <select
            id={categoryId}
            value={selectedCategoryId}
            onChange={(event) => handleCategoryChange(event.target.value)}
          >
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
            <option value={NEW_CATEGORY_OPTION}>+ Add new category…</option>
          </select>
        )}

        {isCreatingCategory && (
          <div className="new-category">
            <input
              id={newCategoryNameId}
              type="text"
              value={newCategoryName}
              onChange={(event) => setNewCategoryName(event.target.value)}
              placeholder="Category name"
              autoFocus
            />
            <div className="color-swatch-picker" role="radiogroup" aria-label="Category color">
              {CATEGORY_COLOR_PALETTE.map((color) => (
                <button
                  key={color}
                  type="button"
                  role="radio"
                  aria-checked={color === newCategoryColor}
                  aria-label={color}
                  className={`color-swatch-option${color === newCategoryColor ? ' selected' : ''}`}
                  style={{ backgroundColor: color }}
                  onClick={() => setNewCategoryColor(color)}
                />
              ))}
            </div>
            <div className="new-category-actions">
              <button type="button" onClick={() => setIsCreatingCategory(false)}>
                Cancel
              </button>
              <button type="button" onClick={handleCreateCategory} disabled={!newCategoryName.trim()}>
                Create category
              </button>
            </div>
          </div>
        )}
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

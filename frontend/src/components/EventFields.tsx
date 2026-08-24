import { useId, useState } from 'react';
import type { RecurrenceFrequency } from '../types/calendar.types';
import { formatFullDate } from '../utils/dateUtils';
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

export interface EventFieldsProps {
  eventName: string;
  onEventNameChange: (value: string) => void;
  /** Always read-only here — see the note above the date field below for
   *  why there's no date picker in this app at all, in either the create
   *  or the edit flow. */
  date: Date;
  startTime: string;
  onStartTimeChange: (value: string) => void;
  endTime: string;
  onEndTimeChange: (value: string) => void;
  recurrence: RecurrenceFrequency;
  onRecurrenceChange: (value: RecurrenceFrequency) => void;
  categoryId: string;
  onCategoryChange: (value: string) => void;
}

/**
 * Pulled out of what used to be AddEventForm so the new edit panel doesn't
 * have to duplicate the category select, the inline "create a new
 * category" sub-form, and the swatch picker — all of that is identical
 * whether you're creating an event or editing one, so it lives here once.
 * The category-creation UI's own open/closed state is self-contained
 * (not lifted to either caller): neither AddEventForm nor the edit panel
 * needs to know or care whether this component is mid-way through
 * creating a category, only what `categoryId` ends up being once it's
 * done.
 */
export function EventFields({
  eventName,
  onEventNameChange,
  date,
  startTime,
  onStartTimeChange,
  endTime,
  onEndTimeChange,
  recurrence,
  onRecurrenceChange,
  categoryId,
  onCategoryChange,
}: EventFieldsProps) {
  const { categories, addCategory } = useCategories();

  // useId: generates stable, unique ids for label/input pairing that are
  // also safe under React StrictMode's double-invoke and won't collide if
  // this form is ever rendered more than once on the same page.
  const nameId = useId();
  const categorySelectId = useId();
  const startTimeId = useId();
  const endTimeId = useId();
  const recurrenceId = useId();
  const newCategoryNameId = useId();

  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState(CATEGORY_COLOR_PALETTE[0]);

  function handleCategoryChange(value: string) {
    if (value === NEW_CATEGORY_OPTION) {
      setIsCreatingCategory(true);
      return;
    }
    onCategoryChange(value);
  }

  function handleCreateCategory() {
    const name = newCategoryName.trim();
    if (!name) return;
    const created = addCategory(name, newCategoryColor);
    onCategoryChange(created.id);
    setIsCreatingCategory(false);
    setNewCategoryName('');
    setNewCategoryColor(CATEGORY_COLOR_PALETTE[0]);
  }

  return (
    <>
      <div className="field">
        <label htmlFor={nameId}>Event name</label>
        <input
          id={nameId}
          type="text"
          value={eventName}
          onChange={(event) => onEventNameChange(event.target.value)}
          placeholder="e.g. Lunch with Mark"
          autoFocus
        />
      </div>

      {/* Deliberately not an <input type="date"> or any other date picker
          — the date is fixed to whichever day the user clicked (for a new
          event) or whichever day the event already falls on (for an
          existing one), shown as plain read-only text rather than a
          disabled input so it's visually obvious it isn't interactive. */}
      <div className="field">
        <span className="field-label">Date</span>
        <p className="field-static-value">{formatFullDate(date)}</p>
      </div>

      <div className="field-row">
        <div className="field">
          <label htmlFor={startTimeId}>Start time</label>
          <input
            id={startTimeId}
            type="time"
            value={startTime}
            onChange={(event) => onStartTimeChange(event.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor={endTimeId}>End time</label>
          <input
            id={endTimeId}
            type="time"
            value={endTime}
            onChange={(event) => onEndTimeChange(event.target.value)}
          />
        </div>
      </div>

      <div className="field">
        <label htmlFor={recurrenceId}>Repeat</label>
        <select
          id={recurrenceId}
          value={recurrence}
          onChange={(event) => onRecurrenceChange(event.target.value as RecurrenceFrequency)}
        >
          {RECURRENCE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label htmlFor={categorySelectId}>Category</label>
        {!isCreatingCategory && (
          <select
            id={categorySelectId}
            value={categoryId}
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
    </>
  );
}

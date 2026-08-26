import type { EventCategory } from '../../types/calendar.types';
import { validateEventForm, type RawEventFormValues } from '../validateEvent';

const categories: EventCategory[] = [
  { id: 'work', name: 'Work', color: '#d98e3c' },
  { id: 'kids', name: 'Kids', color: '#c15b7b' },
];

const DATE = new Date(2026, 7, 25);

function makeRaw(overrides: Partial<RawEventFormValues> = {}): RawEventFormValues {
  return {
    eventName: 'Lunch with Mark',
    categoryId: 'work',
    startTime: '09:00',
    endTime: '10:00',
    recurrence: 'none',
    ...overrides,
  };
}

describe('validateEventForm', () => {
  it('succeeds with valid input, attaching the fixed date', () => {
    const result = validateEventForm(makeRaw(), DATE, categories);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual({
        eventName: 'Lunch with Mark',
        categoryId: 'work',
        date: DATE,
        startTime: '09:00',
        endTime: '10:00',
        recurrence: 'none',
      });
    }
  });

  it('trims the event name', () => {
    const result = validateEventForm(makeRaw({ eventName: '  Lunch  ' }), DATE, categories);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.eventName).toBe('Lunch');
  });

  it('rejects an empty event name', () => {
    const result = validateEventForm(makeRaw({ eventName: '   ' }), DATE, categories);
    expect(result).toEqual({ ok: false, error: 'Event name is required.' });
  });

  it('rejects a category id that does not exist', () => {
    const result = validateEventForm(makeRaw({ categoryId: 'nonexistent' }), DATE, categories);
    expect(result).toEqual({ ok: false, error: 'Choose a category.' });
  });

  it('rejects malformed start/end times', () => {
    const result = validateEventForm(makeRaw({ startTime: '9am' }), DATE, categories);
    expect(result).toEqual({ ok: false, error: 'Pick a start and end time.' });
  });

  it('rejects an end time not after the start time', () => {
    const result = validateEventForm(
      makeRaw({ startTime: '10:00', endTime: '10:00' }),
      DATE,
      categories
    );
    expect(result).toEqual({ ok: false, error: 'End time must be after start time.' });
  });

  it('rejects an end time earlier than the start time', () => {
    const result = validateEventForm(
      makeRaw({ startTime: '14:00', endTime: '09:00' }),
      DATE,
      categories
    );
    expect(result).toEqual({ ok: false, error: 'End time must be after start time.' });
  });

  it('rejects an invalid recurrence value', () => {
    const result = validateEventForm(makeRaw({ recurrence: 'biweekly' }), DATE, categories);
    expect(result).toEqual({ ok: false, error: 'Choose how often this repeats.' });
  });
});

import { calendarReducer, createInitialState } from '../calendarReducer';
import type { CalendarReducerState } from '../../types/calendar.types';

describe('createInitialState', () => {
  it('normalizes the given anchor to the 1st of its month, with no selection', () => {
    const state = createInitialState(new Date(2026, 7, 25));
    expect(state.current).toEqual(new Date(2026, 7, 1));
    expect(state.selectedDate).toBeNull();
  });

  it('defaults to the current date when no anchor is given', () => {
    const before = new Date();
    const state = createInitialState();
    expect(state.current.getFullYear()).toBe(before.getFullYear());
    expect(state.current.getMonth()).toBe(before.getMonth());
  });
});

describe('calendarReducer: SELECT_DAY', () => {
  const base: CalendarReducerState = { current: new Date(2026, 7, 1), selectedDate: null };

  it('selects a day when nothing was selected', () => {
    const next = calendarReducer(base, {
      type: 'SELECT_DAY',
      payload: { date: new Date(2026, 7, 10) },
    });
    expect(next.selectedDate).toEqual(new Date(2026, 7, 10));
  });

  it('deselects when clicking the already-selected day again', () => {
    const withSelection: CalendarReducerState = { ...base, selectedDate: new Date(2026, 7, 10) };
    const next = calendarReducer(withSelection, {
      type: 'SELECT_DAY',
      payload: { date: new Date(2026, 7, 10) },
    });
    expect(next.selectedDate).toBeNull();
  });

  it('switches selection when clicking a different day', () => {
    const withSelection: CalendarReducerState = { ...base, selectedDate: new Date(2026, 7, 10) };
    const next = calendarReducer(withSelection, {
      type: 'SELECT_DAY',
      payload: { date: new Date(2026, 7, 11) },
    });
    expect(next.selectedDate).toEqual(new Date(2026, 7, 11));
  });
});

describe('calendarReducer: CLOSE_DETAILS', () => {
  it('clears the selected day', () => {
    const state: CalendarReducerState = {
      current: new Date(2026, 7, 1),
      selectedDate: new Date(2026, 7, 10),
    };
    const next = calendarReducer(state, { type: 'CLOSE_DETAILS' });
    expect(next.selectedDate).toBeNull();
  });
});

describe('calendarReducer: SET_MONTH', () => {
  it('updates current and clears any selected day', () => {
    const state: CalendarReducerState = {
      current: new Date(2026, 7, 1),
      selectedDate: new Date(2026, 7, 10),
    };
    const next = calendarReducer(state, {
      type: 'SET_MONTH',
      payload: { month: new Date(2026, 8, 1) },
    });
    expect(next.current).toEqual(new Date(2026, 8, 1));
    expect(next.selectedDate).toBeNull();
  });

  it('returns the exact same state reference when the month has not changed', () => {
    const state: CalendarReducerState = { current: new Date(2026, 7, 1), selectedDate: null };
    const next = calendarReducer(state, {
      type: 'SET_MONTH',
      payload: { month: new Date(2026, 7, 1) },
    });
    // Reference equality matters here: useReducer bails out of re-rendering
    // when the reducer returns the same object, which is what stops
    // repeated SET_MONTH dispatches for an unchanged month from cascading
    // into renders elsewhere in the tree.
    expect(next).toBe(state);
  });
});

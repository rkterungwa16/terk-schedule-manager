import { useCallback, useReducer, useState } from 'react';
import type { CalendarEvent, CalendarEventInput, CalendarDisplayMode } from '../types/calendar.types';
import { calendarReducer, createInitialState } from '../hooks/calendarReducer';
import { MOCK_EVENTS } from '../data/mockEvents';
import { CategoriesProvider } from '../context/CategoriesContext';
import { CalendarHeader } from './CalendarHeader';
import { MonthScrollView } from './MonthScrollView';
import { ScheduleView } from './ScheduleView';
import { ViewToggle } from './ViewToggle';
import { ThemeToggle } from './ThemeToggle';
import { useTheme } from '../hooks/useTheme';
import { Legend } from './Legend';
import { Modal } from './Modal';
import { AddEventForm } from './AddEventForm';

interface CalendarProps {
  /** Optional seed data — useful for tests/storybook. Once the component
   *  mounts, event state is owned internally (see `events` below) so
   *  events added through the UI persist regardless of this prop. */
  events?: CalendarEvent[];
}

export function Calendar({ events: eventsProp }: CalendarProps) {
  const [state, dispatch] = useReducer(calendarReducer, undefined, createInitialState);

  // Lazy initializer: this only runs once, on mount, not on every render.
  // Seeded from the static MOCK_EVENTS list rather than a per-month
  // generator — recurrence means an event's visible occurrences aren't
  // tied to any one month anymore (see data/mockEvents.ts), so there's
  // nothing left to regenerate when the visible month changes. Event
  // state lives here (rather than being derived from a prop) because the
  // calendar needs to *mutate* its event list when the user adds one.
  const [events, setEvents] = useState<CalendarEvent[]>(() => eventsProp ?? MOCK_EVENTS);

  const [isAddingEvent, setIsAddingEvent] = useState(false);

  // Independent of the reducer on purpose: switching between Month and
  // Schedule is a plain, un-animated UI toggle with no other state that
  // needs to change atomically alongside it — unlike month navigation,
  // there's no multi-field transition here to protect with useReducer.
  const [displayMode, setDisplayMode] = useState<CalendarDisplayMode>('month');
  const [theme, toggleTheme] = useTheme();

  const handleSelectDay = useCallback(
    (date: Date) => dispatch({ type: 'SELECT_DAY', payload: { date } }),
    []
  );
  const handleCloseDetails = useCallback(() => dispatch({ type: 'CLOSE_DETAILS' }), []);

  const handleOpenAddEvent = useCallback(() => setIsAddingEvent(true), []);
  const handleCloseAddEvent = useCallback(() => setIsAddingEvent(false), []);
  // Both views now scroll through months continuously rather than
  // navigating one at a time, and both drive `state.current` the same
  // way: scroll position tells us the visible month changed, and we jump
  // straight there via SET_MONTH (no slide animation — there's nothing to
  // animate between when the view isn't re-mounting, just scrolling).
  // That's what keeps the header correct regardless of which view the
  // user is actually looking at, and what makes switching views land on
  // the same month you were just looking at in the other one.
  const handleVisibleMonthChange = useCallback(
    (month: Date) => dispatch({ type: 'SET_MONTH', payload: { month } }),
    []
  );

  // Takes the already-validated `CalendarEventInput` (see validateEvent.ts)
  // and fills in the one derived field: `id`, generated here since this is
  // the single place events are created. Color is no longer derived or
  // stored on the event at all — it's looked up from `categoryId` against
  // the live categories list wherever an event is displayed (Day,
  // DayDetails, ScheduleDayRow), so editing a category's color later would
  // correctly repaint every event referencing it, past and future alike.
  const handleAddEvent = useCallback((input: CalendarEventInput) => {
    const newEvent: CalendarEvent = { ...input, id: crypto.randomUUID() };
    // Functional update — `setEvents` never reads `events` from closure,
    // so this callback's identity doesn't need `events` in its dependency
    // array and stays stable across renders.
    setEvents((prev) => [...prev, newEvent]);
    setIsAddingEvent(false);
  }, []);

  return (
    <CategoriesProvider>
      <div id="calendar">
        <CalendarHeader monthAnchor={state.current} />
        <div className="toolbar">
          <ViewToggle mode={displayMode} onChange={setDisplayMode} />
          <ThemeToggle mode={theme} onToggle={toggleTheme} />
        </div>

        {displayMode === 'month' ? (
          <MonthScrollView
            events={events}
            initialMonth={state.current}
            selectedDate={state.selectedDate}
            onSelectDay={handleSelectDay}
            onAddEvent={handleOpenAddEvent}
            onCloseDetails={handleCloseDetails}
            onVisibleMonthChange={handleVisibleMonthChange}
          />
        ) : (
          <ScheduleView
            events={events}
            initialMonth={state.current}
            onVisibleMonthChange={handleVisibleMonthChange}
          />
        )}

        <button type="button" className="add-event-trigger" onClick={handleOpenAddEvent}>
          + Add Event
        </button>
        <Legend />

        {isAddingEvent && (
          <Modal onClose={handleCloseAddEvent}>
            <AddEventForm
              initialDate={state.selectedDate ?? state.current}
              onSubmit={handleAddEvent}
              onCancel={handleCloseAddEvent}
            />
          </Modal>
        )}
      </div>
    </CategoriesProvider>
  );
}

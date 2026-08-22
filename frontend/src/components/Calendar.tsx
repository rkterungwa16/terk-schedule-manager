import { useCallback, useEffect, useReducer, useState } from 'react';
import type { CalendarEvent, CalendarEventInput, CalendarDisplayMode } from '../types/calendar.types';
import { CATEGORY_COLOR_MAP, hasDirection } from '../types/calendar.types';
import { calendarReducer, createInitialState } from '../hooks/calendarReducer';
import { useEventsByDay, getEventsForDay } from '../hooks/useEventsByDay';
import { generateMockEvents } from '../data/mockEvents';
import { CalendarHeader } from './CalendarHeader';
import { MonthGrid } from './MonthGrid';
import { ScheduleView } from './ScheduleView';
import { ViewToggle } from './ViewToggle';
import { ThemeToggle } from './ThemeToggle';
import { useTheme } from '../hooks/useTheme';
import { DayDetails } from './DayDetails';
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
  // Passing a function to useState (instead of calling the generator
  // directly as the argument) avoids re-generating/discarding the array on
  // every re-render. Event state now lives here (rather than being derived
  // from a prop) because the calendar needs to *mutate* its event list when
  // the user adds one.
  const [events, setEvents] = useState<CalendarEvent[]>(
    () => eventsProp ?? generateMockEvents(state.current)
  );

  const [isAddingEvent, setIsAddingEvent] = useState(false);

  // Independent of the reducer on purpose: switching between Month and
  // Schedule is a plain, un-animated UI toggle with no other state that
  // needs to change atomically alongside it — unlike month navigation,
  // there's no multi-field transition here to protect with useReducer.
  const [displayMode, setDisplayMode] = useState<CalendarDisplayMode>('month');
  const [theme, toggleTheme] = useTheme();

  const eventsByDay = useEventsByDay(events);

  const handlePrev = useCallback(() => dispatch({ type: 'PREV_MONTH' }), []);
  const handleNext = useCallback(() => dispatch({ type: 'NEXT_MONTH' }), []);
  const handleSelectDay = useCallback(
    (date: Date) => dispatch({ type: 'SELECT_DAY', payload: { date } }),
    []
  );
  const handleCloseDetails = useCallback(() => dispatch({ type: 'CLOSE_DETAILS' }), []);

  const handleOpenAddEvent = useCallback(() => setIsAddingEvent(true), []);
  const handleCloseAddEvent = useCallback(() => setIsAddingEvent(false), []);

  // Takes the already-validated `CalendarEventInput` (see validateEvent.ts)
  // and turns it into a full `CalendarEvent` by filling in the two derived
  // fields: `id` (generated here, since this is the single place events are
  // created) and `color` (looked up from `calendar` via CATEGORY_COLOR_MAP,
  // the same source-of-truth map the types are derived from — so a "Work"
  // event can never end up with a color other than orange).
  const handleAddEvent = useCallback((input: CalendarEventInput) => {
    const newEvent: CalendarEvent = {
      ...input,
      id: crypto.randomUUID(),
      color: CATEGORY_COLOR_MAP[input.calendar],
    };
    // Functional update — `setEvents` never reads `events` from closure,
    // so this callback's identity doesn't need `events` in its dependency
    // array and stays stable across renders.
    setEvents((prev) => [...prev, newEvent]);
    setIsAddingEvent(false);
  }, []);

  // Drives the 'leaving' -> 'entering' -> 'idle' state machine on a timer,
  // standing in for the CSS `animationend` DOM event the original vanilla
  // version listened for. Kept in an effect (not inline in the handler)
  // because it's a reaction to `state.view` changing, not to the click
  // itself — the dependency array documents exactly that relationship.
  useEffect(() => {
    if (state.view.status === 'leaving') {
      const timeout = window.setTimeout(() => dispatch({ type: 'TRANSITION_END' }), 400);
      return () => window.clearTimeout(timeout);
    }
    if (state.view.status === 'entering') {
      const timeout = window.setTimeout(() => dispatch({ type: 'TRANSITION_END' }), 400);
      return () => window.clearTimeout(timeout);
    }
  }, [state.view]);

  // Type narrowing in action: `hasDirection` narrows `CalendarViewState`
  // down to the two variants that actually carry `direction`, so this can
  // read `state.view.direction` without a cast or an `as` assertion.
  const animationClass = hasDirection(state.view)
    ? `${state.view.status} ${state.view.direction}`
    : 'idle';

  const selectedDayEvents = state.selectedDate
    ? getEventsForDay(eventsByDay, state.selectedDate)
    : null;

  return (
    <div id="calendar">
      <CalendarHeader monthAnchor={state.current} onPrev={handlePrev} onNext={handleNext} />
      <div className="toolbar">
        <ViewToggle mode={displayMode} onChange={setDisplayMode} />
        <ThemeToggle mode={theme} onToggle={toggleTheme} />
      </div>

      {displayMode === 'month' ? (
        <>
          <MonthGrid
            monthAnchor={state.current}
            eventsByDay={eventsByDay}
            selectedDate={state.selectedDate}
            onSelectDay={handleSelectDay}
            animationClass={animationClass}
          />
          {selectedDayEvents && (
            <div onClick={handleCloseDetails}>
              <DayDetails events={selectedDayEvents} onAddEvent={handleOpenAddEvent} />
            </div>
          )}
        </>
      ) : (
        <ScheduleView events={events} initialMonth={state.current} />
      )}

      <button type="button" className="add-event-trigger" onClick={handleOpenAddEvent}>
        + Add Event
      </button>
      <Legend events={events} />

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
  );
}

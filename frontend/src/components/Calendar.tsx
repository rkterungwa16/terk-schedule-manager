import { useCallback, useEffect, useMemo, useReducer, useState } from 'react';
import type { CalendarEvent, CalendarEventInput, CalendarDisplayMode } from '../types/calendar.types';
import { hasDirection } from '../types/calendar.types';
import { calendarReducer, createInitialState } from '../hooks/calendarReducer';
import { addMonths, buildMonthGrid } from '../utils/dateUtils';
import { useEventsByDay, getEventsForDay } from '../hooks/useEventsByDay';
import { MOCK_EVENTS } from '../data/mockEvents';
import { CategoriesProvider } from '../context/CategoriesContext';
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

  // Computed once here (rather than inside MonthGrid) because it's also
  // exactly what useEventsByDay needs: "which specific days should we
  // evaluate recurrence against" — recurrence has no way to answer "which
  // days have events" without first being told which days to check (see
  // useEventsByDay's performance note).
  const monthGridDays = useMemo(() => buildMonthGrid(state.current), [state.current]);
  const eventsByDay = useEventsByDay(events, monthGridDays);

  const handlePrev = useCallback(() => dispatch({ type: 'PREV_MONTH' }), []);
  const handleNext = useCallback(() => dispatch({ type: 'NEXT_MONTH' }), []);
  const handleSelectDay = useCallback(
    (date: Date) => dispatch({ type: 'SELECT_DAY', payload: { date } }),
    []
  );
  const handleCloseDetails = useCallback(() => dispatch({ type: 'CLOSE_DETAILS' }), []);

  const handleOpenAddEvent = useCallback(() => setIsAddingEvent(true), []);
  const handleCloseAddEvent = useCallback(() => setIsAddingEvent(false), []);
  // Scroll position in Schedule view drives `state.current` directly (via
  // the reducer's SET_MONTH), rather than a separate piece of state — so
  // switching back to Month view shows exactly the month last scrolled to,
  // and the header (which reads `state.current` regardless of mode) never
  // has two different ideas of "the current month" to reconcile.
  const handleScheduleMonthChange = useCallback(
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

  // What Prev/Next navigation is *headed toward*, computed immediately
  // rather than waiting for the animation to finish. `state.current` only
  // actually updates at TRANSITION_END — a deliberate ~400ms after the
  // click, so MonthGrid's own slide-out animation has something to show
  // (see calendarReducer's NEXT_MONTH/PREV_MONTH cases). But that same lag
  // means anything reading `state.current` during the 'leaving' phase —
  // the header, and Schedule view's initial scroll position if the user
  // switches views mid-click — would show the month being left, not the
  // one just requested. MonthGrid itself still reads the literal
  // `state.current` below (it needs the real transition timing to animate
  // correctly); this anticipated value is only for the two places that
  // just need to know "what month did the user ask for," immediately.
  const effectiveCurrentMonth =
    state.view.status === 'leaving'
      ? addMonths(state.current, state.view.direction === 'next' ? 1 : -1)
      : state.current;

  return (
    <CategoriesProvider>
      <div id="calendar">
        <CalendarHeader
          monthAnchor={effectiveCurrentMonth}
          onPrev={displayMode === 'month' ? handlePrev : undefined}
          onNext={displayMode === 'month' ? handleNext : undefined}
        />
        <div className="toolbar">
          <ViewToggle mode={displayMode} onChange={setDisplayMode} />
          <ThemeToggle mode={theme} onToggle={toggleTheme} />
        </div>

        {displayMode === 'month' ? (
          <>
            <MonthGrid
              monthAnchor={state.current}
              days={monthGridDays}
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
          <ScheduleView
            events={events}
            initialMonth={effectiveCurrentMonth}
            onVisibleMonthChange={handleScheduleMonthChange}
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

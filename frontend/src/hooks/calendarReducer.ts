import type { CalendarAction, CalendarReducerState } from '../types/calendar.types';
import { assertUnreachable } from '../types/calendar.types';
import { isSameDay } from '../utils/dateUtils';

export function createInitialState(anchor: Date = new Date()): CalendarReducerState {
  return {
    current: new Date(anchor.getFullYear(), anchor.getMonth(), 1),
    selectedDate: null,
  };
}

/**
 * `useReducer` (rather than a couple of `useState` calls) is still the
 * right tool even with just two fields: `current` and `selectedDate`
 * change together in SET_MONTH (moving to a different month clears
 * whatever was selected in the old one — see that case below), and a
 * reducer keeps that pairing atomic rather than relying on two separate
 * `setState` calls always being written in the right order at every call
 * site.
 *
 * There used to be a third field here, `view` (a discriminated union
 * tracking a leaving/entering slide animation for Prev/Next clicks), and
 * two more action types driving it. Once Month view became a continuous
 * scroll (see MonthScrollView) instead of one-month-at-a-time navigation,
 * there was no more click to animate a transition for — both views now
 * report their own visible-month changes via SET_MONTH, the same way.
 *
 * The `CalendarAction` discriminated union means every `case` below
 * narrows `action` to exactly the variant with that `type`, so
 * `action.payload` is only visible (and only required) on the branch
 * that actually needs it — no optional-field / manual-cast juggling.
 */
export function calendarReducer(
  state: CalendarReducerState,
  action: CalendarAction
): CalendarReducerState {
  switch (action.type) {
    case 'SELECT_DAY': {
      const { date } = action.payload;
      const alreadySelected = state.selectedDate && isSameDay(state.selectedDate, date);
      return {
        ...state,
        selectedDate: alreadySelected ? null : date,
      };
    }

    case 'CLOSE_DETAILS':
      return { ...state, selectedDate: null };

    case 'SET_MONTH': {
      // Dispatched by whichever view (Month or Schedule) reports that its
      // scroll position moved to a different month — this is how the
      // header, and the *other* view's initial scroll position the next
      // time it mounts, stay in sync with wherever the user actually is.
      // Clears `selectedDate` too: a day selected in whatever month was
      // previously current has no meaning once browsing has moved to a
      // different month entirely.
      if (state.current.getTime() === action.payload.month.getTime()) return state;
      return {
        ...state,
        current: action.payload.month,
        selectedDate: null,
      };
    }

    default:
      // Exhaustiveness check: if CalendarAction ever gains a new variant
      // without a corresponding `case` above, `action` is not assignable
      // to `never` here and TypeScript fails the build.
      return assertUnreachable(action);
  }
}

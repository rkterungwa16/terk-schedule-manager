import type { CalendarAction, CalendarReducerState } from '../types/calendar.types';
import { assertUnreachable } from '../types/calendar.types';
import { addMonths, isSameDay } from '../utils/dateUtils';

export function createInitialState(anchor: Date = new Date()): CalendarReducerState {
  return {
    current: new Date(anchor.getFullYear(), anchor.getMonth(), 1),
    selectedDate: null,
    view: { status: 'idle' },
  };
}

/**
 * `useReducer` (rather than several `useState` calls) is the right tool
 * here because the three pieces of state — the visible month, the
 * selected day, and the animation phase — change *together* as atomic
 * transitions. Modeling them as separate `useState` calls invites
 * "torn" intermediate renders (e.g. `current` updated but `view` not yet
 * flipped to 'leaving'), which is exactly the class of bug the original
 * jQuery code worked around with manually-ordered imperative calls
 * (`this.next = true` set as a side effect *before* calling `draw()`).
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
    case 'NEXT_MONTH':
      return {
        ...state,
        view: { status: 'leaving', direction: 'next' },
      };

    case 'PREV_MONTH':
      return {
        ...state,
        view: { status: 'leaving', direction: 'prev' },
      };

    case 'TRANSITION_END': {
      if (state.view.status !== 'leaving') return state;
      const { direction } = state.view;
      const delta = direction === 'next' ? 1 : -1;
      return {
        ...state,
        current: addMonths(state.current, delta),
        view: { status: 'entering', direction },
      };
    }

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
      // A silent jump — used when Schedule view's scroll position tells us
      // the visible month changed, so Month view shows the same month the
      // instant the user switches back to it. Deliberately distinct from
      // NEXT_MONTH/PREV_MONTH: those trigger the leaving/entering slide
      // animation, which makes sense for an explicit arrow click but not
      // for "the background view quietly stayed in sync while scrolling
      // somewhere else" — Month view isn't even mounted to animate while
      // Schedule view is open. Clears `selectedDate` too: a day selected
      // in whatever month was previously current has no meaning once
      // browsing has moved to a different month entirely.
      if (state.current.getTime() === action.payload.month.getTime()) return state;
      return {
        ...state,
        current: action.payload.month,
        selectedDate: null,
        view: { status: 'idle' },
      };
    }

    default:
      // Exhaustiveness check: if CalendarAction ever gains a new variant
      // without a corresponding `case` above, `action` is not assignable
      // to `never` here and TypeScript fails the build.
      return assertUnreachable(action);
  }
}

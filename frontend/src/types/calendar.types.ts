/**
 * ============================================================================
 * DOMAIN TYPES
 * ============================================================================
 *
 * This file is intentionally the most "TypeScript-heavy" file in the project.
 * Components should mostly *consume* narrow, inferred types — the heavy
 * lifting (unions, discriminated unions, mapped/conditional types) lives
 * here so the rest of the codebase stays simple to read.
 */

// ----------------------------------------------------------------------------
// 1. Event categories are no longer a fixed, closed set — the user can add
//    their own. That's a meaningful type-design fork from where this file
//    started: a *closed* set of categories was modeled as a compile-time
//    literal union (`keyof typeof CATEGORY_COLOR_MAP`), which let TypeScript
//    catch a typo'd category name at build time. That approach fundamentally
//    cannot express "the user can add a new one at runtime" — a literal
//    union's members are fixed when the code is compiled. So categories are
//    now ordinary *data* (an `EventCategory[]` array, held in state — see
//    CategoriesContext), and an event references one by `categoryId: string`,
//    validated at the point of use (form submission) against whatever
//    categories currently exist, rather than by the type checker.
// ----------------------------------------------------------------------------

export interface EventCategory {
  id: string;
  name: string;
  /** A flat hex value from the app's swatch palette — see
   *  data/categories.ts. Not a CSS class name or design token, because a
   *  user-created category's color isn't known until they pick it. */
  color: string;
}

// ----------------------------------------------------------------------------
// 2. Interface vs type alias — used deliberately for different jobs.
//
//    We use an `interface` for CalendarEvent because it describes an
//    *object shape* that other parts of the app may want to extend
//    (interfaces support declaration merging & `extends`, which communicates
//    "this is an entity/contract"). We use `type` aliases everywhere we need
//    unions, mapped types, or tuples, because `interface` cannot express
//    those directly.
// ----------------------------------------------------------------------------

export interface CalendarEvent {
  id: string;
  eventName: string;
  categoryId: string;
  /** The exact date of the first (or only, for non-repeating events)
   *  occurrence — never a "day of the month" pattern. Which other dates
   *  this event also appears on is *computed* from this date plus
   *  `recurrence` (see utils/recurrence.ts), not stored. */
  date: Date;
  /** "HH:MM", 24-hour — the native format `<input type="time">` uses, kept
   *  as-is rather than converted to e.g. minutes-since-midnight, since
   *  every place that reads it either displays it or feeds it straight
   *  back into a time input. */
  startTime: string;
  endTime: string;
  recurrence: RecurrenceFrequency;
}

/**
 * A narrower "input" shape for creating events, expressed with a utility
 * type instead of being hand-written: Omit<T, K> removes `id`, which is
 * generated at creation time, not supplied by the caller. This means
 * CalendarEventInput automatically stays in sync if CalendarEvent ever
 * changes shape.
 */
export type CalendarEventInput = Omit<CalendarEvent, 'id'>;

// ----------------------------------------------------------------------------
// 3. Discriminated unions for UI state — this is the core pattern used to
//    model the calendar's "state machine" (idle / animating in / animating
//    out, in the 'next' or 'prev' direction). Each member has a literal
//    `status` field (the "discriminant" / "tag"). TypeScript narrows the
//    whole object once you check that field, so `direction` is only
//    accessible where it's actually guaranteed to exist — the compiler
//    enforces what used to be a runtime assumption in the original jQuery
//    version (`this.next` being set "somewhere else" before `draw()` ran).
// ----------------------------------------------------------------------------

export type MonthTransitionDirection = 'next' | 'prev';

export type CalendarViewState =
  | { status: 'idle' }
  | { status: 'entering'; direction: MonthTransitionDirection }
  | { status: 'leaving'; direction: MonthTransitionDirection };

/**
 * Type narrowing example — a type guard (predicate function) that narrows
 * `CalendarViewState` down to the two variants that carry a `direction`.
 * The `is` return type is what makes `if (hasDirection(state))` narrow the
 * type for the compiler, not just for a human reading it.
 */
export function hasDirection(
  state: CalendarViewState
): state is Extract<CalendarViewState, { direction: MonthTransitionDirection }> {
  return state.status === 'entering' || state.status === 'leaving';
}

// ----------------------------------------------------------------------------
// 4. Discriminated union for reducer actions. Using a *tagged* union (as
//    opposed to a plain interface with optional fields) means the reducer's
//    switch statement gets full exhaustiveness checking, and each `case`
//    branch automatically narrows `action.payload` to the correct shape.
// ----------------------------------------------------------------------------

export type CalendarAction =
  | { type: 'NEXT_MONTH' }
  | { type: 'PREV_MONTH' }
  | { type: 'SELECT_DAY'; payload: { date: Date } }
  | { type: 'CLOSE_DETAILS' }
  | { type: 'TRANSITION_END' }
  | { type: 'SET_MONTH'; payload: { month: Date } };

export interface CalendarReducerState {
  /** First-of-month anchor for the month currently on screen. */
  current: Date;
  /** Which day (if any) has its detail panel open. */
  selectedDate: Date | null;
  view: CalendarViewState;
}

// ----------------------------------------------------------------------------
// 5. Conditional + mapped types. `ActionPayload<T>` is a small generic
//    conditional type: "if this union member has a `payload` field, extract
//    its type, otherwise `never`". Combined with a mapped type over
//    CalendarAction['type'], this gives us a lookup table of every action's
//    payload type without writing it out by hand — handy if the reducer
//    grows and you want autocomplete/typo-safety when dispatching.
// ----------------------------------------------------------------------------

type ActionPayload<A> = A extends { payload: infer P } ? P : never;

export type ActionPayloadMap = {
  [A in CalendarAction as A['type']]: ActionPayload<A>;
};
// Equivalent to:
// {
//   NEXT_MONTH: never;
//   PREV_MONTH: never;
//   SELECT_DAY: { date: Date };
//   CLOSE_DETAILS: never;
//   TRANSITION_END: never;
// }

// ----------------------------------------------------------------------------
// 6. Generics — a small reusable grouping utility used by the events hook.
//    `K extends PropertyKey` constrains the generic so it can only be
//    instantiated with something usable as an object key (string | number |
//    symbol), which is exactly what `Record<K, T[]>` needs.
// ----------------------------------------------------------------------------

export function groupBy<T, K extends PropertyKey>(
  items: readonly T[],
  keyFn: (item: T) => K
): Record<K, T[]> {
  const result = {} as Record<K, T[]>;
  for (const item of items) {
    const key = keyFn(item);
    (result[key] ??= []).push(item);
  }
  return result;
}

// ----------------------------------------------------------------------------
// 7. `unknown` at a real untyped boundary. Category membership is no longer
//    something a type guard can check — the set isn't closed at compile
//    time anymore (see section 1) — so validating a category reference now
//    needs the *current* categories list as data, not just the type
//    checker. That check now lives in utils/validateEvent.ts, next to the
//    rest of the add-event form's validation, rather than here.
// ----------------------------------------------------------------------------

export function isRecurrenceFrequency(value: unknown): value is RecurrenceFrequency {
  return value === 'none' || value === 'daily' || value === 'weekly' || value === 'monthly' || value === 'yearly';
}

/**
 * Exhaustiveness helper. If a switch/if-else chain is ever missing a case
 * for a union member, TypeScript will fail to narrow the value down to
 * `never` at the point this is called, producing a compile error — turning
 * a forgotten `case` into a build failure instead of a silent runtime bug.
 */
export function assertUnreachable(value: never): never {
  throw new Error(`Unreachable case: ${JSON.stringify(value)}`);
}

// ----------------------------------------------------------------------------
// 8. A generic `Result<T>` — the "add event" form needs to report either a
//    validated CalendarEventInput or a human-readable error, and nothing
//    else in this file needs that exact shape. Making it generic (instead
//    of a one-off `EventFormResult` union) means it's reusable for any
//    future validation (e.g. editing an event, importing a feed) without
//    redefining the ok/error shape each time. This combines two of the
//    patterns above: it's a discriminated union (tag = `ok`) *and* generic.
// ----------------------------------------------------------------------------

export type Result<T> = { ok: true; value: T } | { ok: false; error: string };

/** The concrete instantiation used by the add-event form. */
export type EventFormResult = Result<CalendarEventInput>;

// ----------------------------------------------------------------------------
// 9. Schedule view. `CalendarDisplayMode` is a plain (non-discriminated)
//    union because neither variant carries extra data — there's nothing to
//    narrow *to*, just a mode name to switch on. That's the distinction
//    worth drawing out: reach for a discriminated union when different
//    variants need different payloads (CalendarViewState, CalendarAction);
//    a plain string union is the right, simpler tool when they don't.
// ----------------------------------------------------------------------------

export type CalendarDisplayMode = 'month' | 'schedule';

/** Also a plain union, same reasoning as CalendarDisplayMode above —
 *  neither variant carries a payload. */
export type ThemeMode = 'light' | 'dark';

/** A fourth plain union in the same family: none of the five recurrence
 *  modes needs its own payload (unlike, say, CalendarAction's SELECT_DAY,
 *  which needs a date) — just a mode to switch on. `eventOccursOnDate`
 *  (utils/recurrence.ts) is the exhaustive switch that gives this type
 *  meaning; this file only declares the shape. */
export type RecurrenceFrequency = 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';

/** One entry in the schedule list: a day plus every event that falls on it. */
export interface ScheduleDayGroup {
  date: Date;
  events: CalendarEvent[];
}

// ----------------------------------------------------------------------------
// 10. Infinite schedule scroll. The virtualized list mixes two visually and
//     structurally different kinds of row — a month divider (just a label)
//     and a day (a date plus its events) — in one flat array, because a
//     virtualizer needs a single indexable list, not a nested
//     months-containing-days structure. A discriminated union (`kind` as
//     the tag) is exactly the right shape for that: the render function
//     switches on `row.kind` and TypeScript narrows each branch to the
//     fields that variant actually has, the same pattern used for
//     CalendarAction and CalendarViewState earlier — just applied to list
//     rows instead of reducer actions or animation state.
// ----------------------------------------------------------------------------

export type ScheduleRow =
  | { kind: 'month-divider'; key: string; label: string; month: Date }
  | { kind: 'day'; key: string; group: ScheduleDayGroup; month: Date };

/** Which edge of the loaded window a scroll-triggered load should extend. */
export type LoadDirection = 'past' | 'future';

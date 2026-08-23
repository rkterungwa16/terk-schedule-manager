import { memo } from 'react';
import type { CalendarEvent } from '../types/calendar.types';
import { formatDayName, formatDayNumber, isSameDay, isSameMonth } from '../utils/dateUtils';
import { useCategories } from '../context/CategoriesContext';
import { getCategory } from '../data/categories';

interface DayProps {
  date: Date;
  monthAnchor: Date;
  today: Date;
  events: CalendarEvent[];
  isSelected: boolean;
  onSelect: (date: Date) => void;
}

/**
 * PERFORMANCE: `React.memo`
 * -------------------------
 * A month grid renders 42 `Day` cells. Without memoization, opening a
 * single day's detail panel (a change to one piece of parent state)
 * would re-render all 42 cells, even though only the previously-selected
 * cell and the newly-selected cell actually changed visually.
 *
 * `memo` does a shallow prop comparison and skips re-rendering when props
 * are referentially equal to the previous render. This only pays off if:
 *   1. `events` is a *stable* array reference across renders where this
 *      day's events haven't changed (guaranteed by `useEventsByDay`'s
 *      `useMemo`, which only recomputes the whole map when `events`
 *      changes — the day's own slice of that map is a stable reference
 *      between recomputes).
 *   2. `onSelect` is a *stable* function reference (guaranteed by
 *      `useCallback` in the parent — see MonthGrid.tsx).
 * Without both of those, `memo` is dead weight: new array/function
 * literals created every render would fail the shallow-equality check
 * and force a re-render anyway, while still paying the comparison cost.
 *
 * One caveat `memo` doesn't cover: `useCategories()` below reads Context,
 * and a Context value change re-renders every consumer regardless of
 * `memo` — props aren't the only thing that can trigger a render.
 * Creating a new category re-renders all 42 cells for that one reason.
 * That's the right tradeoff (categories are read by id on every render
 * anyway, and adding one is a rare, deliberate action, not something that
 * happens on a hot path like scrolling or selecting a day), just worth
 * being precise about rather than implying `memo` makes this component
 * immune to all re-renders.
 */
function DayComponent({ date, monthAnchor, today, events, isSelected, onSelect }: DayProps) {
  const { categories } = useCategories();
  const inCurrentMonth = isSameMonth(date, monthAnchor);
  const isToday = isSameDay(date, today);
  const hasEvents = inCurrentMonth && events.length > 0;

  const classNames = ['day'];
  if (!inCurrentMonth) classNames.push('other');
  else if (isToday) classNames.push('today');
  if (isSelected) classNames.push('selected');
  if (hasEvents) classNames.push('has-events');

  // Cap the number of dots actually drawn. The original version rendered
  // one square per event with no limit — fine for 1-2 events, but a day
  // with 8 events would overflow the cell width with an unbroken row of
  // squares, which reads as visual noise rather than a signal. Past the
  // cap, a single mono "+N" marker communicates "there's more here"
  // without the marker itself needing to scale unboundedly.
  const MAX_VISIBLE_DOTS = 4;
  const visibleEvents = events.slice(0, MAX_VISIBLE_DOTS);
  const overflowCount = events.length - visibleEvents.length;

  // A count in the accessible name is the marking for anyone who can't or
  // doesn't rely on the color squares — screen reader users, and anyone
  // for whom four 5px squares aren't a reliable signal on a small screen.
  const accessibleLabel = hasEvents
    ? `${formatDayName(date)} ${formatDayNumber(date)}, ${events.length} event${
        events.length === 1 ? '' : 's'
      }`
    : `${formatDayName(date)} ${formatDayNumber(date)}`;

  return (
    <button
      type="button"
      className={classNames.join(' ')}
      onClick={() => onSelect(date)}
      aria-label={accessibleLabel}
    >
      <div className="day-name" aria-hidden="true">
        {formatDayName(date)}
      </div>
      <div className="day-number" aria-hidden="true">
        {formatDayNumber(date)}
      </div>
      {inCurrentMonth && (
        <div className="day-events" aria-hidden="true">
          {visibleEvents.map((event) => (
            <span
              key={event.id}
              style={{ backgroundColor: getCategory(categories, event.categoryId).color }}
            />
          ))}
          {overflowCount > 0 && <span className="day-events-overflow">+{overflowCount}</span>}
        </div>
      )}
    </button>
  );
}

export const Day = memo(DayComponent);

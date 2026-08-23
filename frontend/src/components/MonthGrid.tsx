import { useCallback, useMemo } from 'react';
import type { CalendarEvent } from '../types/calendar.types';
import { dayKey, isSameDay } from '../utils/dateUtils';
import { getEventsForDay } from '../hooks/useEventsByDay';
import { Day } from './Day';

interface MonthGridProps {
  monthAnchor: Date;
  /** The 42-cell grid (leading/trailing days from adjacent months
   *  included) — computed once by Calendar.tsx, since it's also what
   *  `useEventsByDay` needs to know which specific days to evaluate
   *  recurrence against. Passing it down here avoids computing the same
   *  grid twice from the same `monthAnchor`. */
  days: Date[];
  eventsByDay: Record<string, CalendarEvent[]>;
  selectedDate: Date | null;
  onSelectDay: (date: Date) => void;
  animationClass: string;
}

const TODAY = new Date();

export function MonthGrid({
  monthAnchor,
  days,
  eventsByDay,
  selectedDate,
  onSelectDay,
  animationClass,
}: MonthGridProps) {
  // useCallback: gives Day's React.memo a stable function reference across
  // renders, so selecting one day doesn't force all 42 Day cells to
  // re-render just because MonthGrid re-rendered and (without this) would
  // have created a brand-new `onSelectDay` closure every time.
  const handleSelect = useCallback(
    (date: Date) => {
      onSelectDay(date);
    },
    [onSelectDay]
  );

  const weeks = useMemo(() => {
    const chunks: Date[][] = [];
    for (let i = 0; i < days.length; i += 7) {
      chunks.push(days.slice(i, i + 7));
    }
    return chunks;
  }, [days]);

  return (
    <div className={`month ${animationClass}`}>
      {weeks.map((week) => (
        <div className="week" key={dayKey(week[0])}>
          {week.map((date) => (
            <Day
              key={dayKey(date)}
              date={date}
              monthAnchor={monthAnchor}
              today={TODAY}
              events={getEventsForDay(eventsByDay, date)}
              isSelected={selectedDate !== null && isSameDay(date, selectedDate)}
              onSelect={handleSelect}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

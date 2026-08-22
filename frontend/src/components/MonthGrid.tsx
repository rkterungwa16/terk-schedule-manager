import { useCallback, useMemo } from 'react';
import type { CalendarEvent } from '../types/calendar.types';
import { buildMonthGrid, dayKey, isSameDay } from '../utils/dateUtils';
import { getEventsForDay } from '../hooks/useEventsByDay';
import { Day } from './Day';

interface MonthGridProps {
  monthAnchor: Date;
  eventsByDay: Record<string, CalendarEvent[]>;
  selectedDate: Date | null;
  onSelectDay: (date: Date) => void;
  animationClass: string;
}

const TODAY = new Date();

export function MonthGrid({
  monthAnchor,
  eventsByDay,
  selectedDate,
  onSelectDay,
  animationClass,
}: MonthGridProps) {
  // useMemo: buildMonthGrid does real work (allocates 35-42 Date objects).
  // Recomputing it on every render — including renders triggered by, say,
  // opening a day's details panel — would be wasted work. It only needs to
  // change when the visible month changes.
  const days = useMemo(() => buildMonthGrid(monthAnchor), [monthAnchor]);

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

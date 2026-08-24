import { useCallback, useMemo } from 'react';
import type { CalendarEvent } from '../types/calendar.types';
import { buildMonthGrid, dayKey, isSameDay, isSameMonth } from '../utils/dateUtils';
import { useEventsByDay, getEventsForDay } from '../hooks/useEventsByDay';
import { Day } from './Day';
import { DayDetails } from './DayDetails';
import { ScheduleMonthDivider } from './ScheduleMonthDivider';

interface MonthBlockProps {
  month: Date;
  events: CalendarEvent[];
  selectedDate: Date | null;
  onSelectDay: (date: Date) => void;
  onAddEvent: () => void;
  onViewEvent: (event: CalendarEvent) => void;
  onCloseDetails: () => void;
  today: Date;
}

/**
 * Each mounted block computes its own 42-cell grid and event map,
 * independently of every other block. That's deliberate: virtualization
 * (see MonthScrollView) only ever mounts a handful of these at once
 * regardless of how many months are loaded, so there's no benefit to
 * centralizing "events by day" across the whole loaded range the way the
 * old single-month view's Calendar.tsx did — most of that would just be
 * thrown away unmounted work.
 */
export function MonthBlock({
  month,
  events,
  selectedDate,
  onSelectDay,
  onAddEvent,
  onViewEvent,
  onCloseDetails,
  today,
}: MonthBlockProps) {
  const days = useMemo(() => buildMonthGrid(month), [month]);
  const eventsByDay = useEventsByDay(events, days);

  const weeks = useMemo(() => {
    const chunks: Date[][] = [];
    for (let i = 0; i < days.length; i += 7) {
      chunks.push(days.slice(i, i + 7));
    }
    return chunks;
  }, [days]);

  // Only true when the selected day actually belongs to *this* month, not
  // when it merely appears as a grayed leading/trailing padding cell here
  // (the same date can appear as padding in one block and as a real day in
  // the adjacent one — without this check, DayDetails could render twice
  // for the same selection).
  const selectedWeekIndex = useMemo(() => {
    if (!selectedDate || !isSameMonth(selectedDate, month)) return -1;
    return weeks.findIndex((week) => week.some((date) => isSameDay(date, selectedDate)));
  }, [weeks, selectedDate, month]);

  const handleSelect = useCallback((date: Date) => onSelectDay(date), [onSelectDay]);

  return (
    <div className="month-block">
      <ScheduleMonthDivider label={month.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} />
      <div className="month">
        {weeks.map((week, weekIndex) => (
          <div key={dayKey(week[0])}>
            <div className="week">
              {week.map((date) => (
                <Day
                  key={dayKey(date)}
                  date={date}
                  monthAnchor={month}
                  today={today}
                  events={getEventsForDay(eventsByDay, date)}
                  isSelected={selectedDate !== null && isSameDay(date, selectedDate)}
                  onSelect={handleSelect}
                />
              ))}
            </div>
            {weekIndex === selectedWeekIndex && selectedDate && (
              <div onClick={onCloseDetails}>
                <DayDetails
                  events={getEventsForDay(eventsByDay, selectedDate)}
                  onAddEvent={onAddEvent}
                  onViewEvent={onViewEvent}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

import { memo } from 'react';
import type { ScheduleDayGroup } from '../types/calendar.types';
import { isSameDay } from '../utils/dateUtils';

interface ScheduleDayRowProps {
  group: ScheduleDayGroup;
  today: Date;
}

const WEEKDAY_FORMAT = new Intl.DateTimeFormat('en-US', { weekday: 'short' });
const DAY_FORMAT = new Intl.DateTimeFormat('en-US', { day: 'numeric' });
const MONTH_FORMAT = new Intl.DateTimeFormat('en-US', { month: 'short' });

/**
 * PERFORMANCE: same rationale as `Day` in the month grid — `memo` here
 * means adding a new event to *one* day only re-renders that day's row
 * (plus whatever new row it creates), not every row already in the list.
 * This only pays off because `group` is a stable reference for every day
 * whose events didn't change — guaranteed by `useScheduleDays`' `useMemo`,
 * which only rebuilds groups when `events` or `monthAnchor` actually change.
 */
function ScheduleDayRowComponent({ group, today }: ScheduleDayRowProps) {
  const isToday = isSameDay(group.date, today);

  return (
    <div className={`schedule-day${isToday ? ' today' : ''}`}>
      <div className="schedule-day-date">
        <div className="schedule-day-weekday">{WEEKDAY_FORMAT.format(group.date)}</div>
        <div className="schedule-day-number">{DAY_FORMAT.format(group.date)}</div>
        <div className="schedule-day-month">{MONTH_FORMAT.format(group.date)}</div>
      </div>
      <ul className="schedule-day-events">
        {group.events.map((event) => (
          <li key={event.id} className="schedule-event">
            <span className={`event-category ${event.color}`} />
            <span>{event.eventName}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export const ScheduleDayRow = memo(ScheduleDayRowComponent);

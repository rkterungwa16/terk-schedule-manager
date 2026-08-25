import { memo } from "react";
import type { CalendarEvent, ScheduleDayGroup } from "../types/calendar.types";
import { formatTimeLabel, isSameDay } from "../utils/dateUtils";
import { useCategories } from "../context/CategoriesContext";
import { getCategory } from "../data/categories";

interface ScheduleDayRowProps {
  group: ScheduleDayGroup;
  today: Date;
  onViewEvent: (event: CalendarEvent) => void;
}

const WEEKDAY_FORMAT = new Intl.DateTimeFormat("en-US", { weekday: "short" });
const DAY_FORMAT = new Intl.DateTimeFormat("en-US", { day: "numeric" });
const MONTH_FORMAT = new Intl.DateTimeFormat("en-US", { month: "short" });

/**
 * PERFORMANCE: same rationale as `Day` in the month grid — `memo` here
 * means adding a new event to *one* day only re-renders that day's row
 * (plus whatever new row it creates), not every row already in the list.
 * This only pays off because `group` is a stable reference for every day
 * whose events didn't change — guaranteed by `useScheduleRows`' `useMemo`,
 * which only rebuilds groups when `months` or `events` actually change.
 * Same Context caveat as `Day`: adding a category still re-renders every
 * row regardless of `memo`, since that's a Context change, not a prop one.
 */
function ScheduleDayRowComponent({
  group,
  today,
  onViewEvent,
}: ScheduleDayRowProps) {
  const { categories } = useCategories();
  const isToday = isSameDay(group.date, today);

  return (
    <div className={`schedule-day${isToday ? " today" : ""}`}>
      <div className="schedule-day-date">
        <div className="schedule-day-weekday">
          {WEEKDAY_FORMAT.format(group.date)}
        </div>
        <div className="schedule-day-number">
          {DAY_FORMAT.format(group.date)}
        </div>
        <div className="schedule-day-month">
          {MONTH_FORMAT.format(group.date)}
        </div>
      </div>
      <ul className="schedule-day-events">
        {group.events.length === 0 ? (
          <li className="schedule-event schedule-event-empty">No events</li>
        ) : (
          group.events.map((event) => (
            <li key={event.id}>
              <button
                type="button"
                className="schedule-event"
                onClick={() => onViewEvent(event)}
              >
                <span
                  className="event-category"
                  style={{
                    backgroundColor: getCategory(categories, event.categoryId)
                      .color,
                  }}
                />
                <span className="event-time">
                  {formatTimeLabel(event.startTime)}
                </span>
                <span>{event.eventName}</span>
              </button>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}

export const ScheduleDayRow = memo(ScheduleDayRowComponent);

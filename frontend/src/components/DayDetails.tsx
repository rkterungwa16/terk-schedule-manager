import type { CalendarEvent } from '../types/calendar.types';
import { useCategories } from '../context/CategoriesContext';
import { getCategory } from '../data/categories';
import { formatTimeLabel } from '../utils/dateUtils';

interface DayDetailsProps {
  events: CalendarEvent[];
  onAddEvent: () => void;
  onViewEvent: (event: CalendarEvent) => void;
}

export function DayDetails({ events, onAddEvent, onViewEvent }: DayDetailsProps) {
  const { categories } = useCategories();

  return (
    <div className="details in">
      <div className="arrow" />
      <div className="events in">
        {events.length === 0 && (
          <div className="event empty">
            <span>No Events</span>
          </div>
        )}
        {events.map((event) => (
          <button
            type="button"
            className="event"
            key={event.id}
            onClick={(clickEvent) => {
              // Same reasoning as the "+ Add event" button below: this
              // panel sits inside a wrapper that closes it on any click,
              // so opening an event's details needs to stop that click
              // from reaching the wrapper first.
              clickEvent.stopPropagation();
              onViewEvent(event);
            }}
          >
            <div
              className="event-category"
              style={{ backgroundColor: getCategory(categories, event.categoryId).color }}
            />
            <span className="event-time">{formatTimeLabel(event.startTime)}</span>
            <span>{event.eventName}</span>
          </button>
        ))}
        <button
          type="button"
          className="add-event-link"
          onClick={(clickEvent) => {
            // This panel sits inside a wrapper `<div onClick={handleCloseDetails}>`
            // (see Calendar.tsx) so clicking anywhere closes the panel by
            // design. Stop that click from bubbling so "add event" can open
            // the modal instead of closing the panel out from under it.
            clickEvent.stopPropagation();
            onAddEvent();
          }}
        >
          + Add event
        </button>
      </div>
    </div>
  );
}

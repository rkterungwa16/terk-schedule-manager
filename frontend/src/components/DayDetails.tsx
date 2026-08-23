import type { CalendarEvent } from '../types/calendar.types';
import { useCategories } from '../context/CategoriesContext';
import { getCategory } from '../data/categories';
import { formatTimeLabel } from '../utils/dateUtils';

interface DayDetailsProps {
  events: CalendarEvent[];
  onAddEvent: () => void;
}

export function DayDetails({ events, onAddEvent }: DayDetailsProps) {
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
          <div className="event" key={event.id}>
            <div
              className="event-category"
              style={{ backgroundColor: getCategory(categories, event.categoryId).color }}
            />
            <span className="event-time">{formatTimeLabel(event.startTime)}</span>
            <span>{event.eventName}</span>
          </div>
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

import type {
  CalendarEvent,
  CalendarEventInput,
} from "../types/calendar.types";
import { EditEventForm } from "./EditEventForm";

interface EventEditPanelProps {
  event: CalendarEvent;
  onSave: (id: string, input: CalendarEventInput) => void;
  onClose: () => void;
}

/**
 * Conditionally rendered by the caller (`{viewingEvent && <EventEditPanel
 * .../>}`), the same way Modal is — so there's no null-event case to
 * handle here, and the slide-in is just this component's mount animation
 * (see `.event-panel`'s `animation` in index.css), not a persistent node
 * whose visibility toggles. That mirrors how the rest of the app animates
 * things in (Modal's fadeIn, DayDetails' `.details.in`) rather than
 * managing a manual open/closed class — consistent with the existing
 * pattern instead of introducing a new one for just this panel.
 */
export function EventEditPanel({
  event,
  onSave,
  onClose,
}: EventEditPanelProps) {
  return (
    <div className="event-panel-overlay" onClick={onClose} role="presentation">
      <div
        className="event-panel"
        onClick={(clickEvent) => clickEvent.stopPropagation()}
        role="dialog"
        aria-label="Event details"
      >
        <button
          type="button"
          className="event-panel-close"
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>
        <EditEventForm event={event} onSave={onSave} onCancel={onClose} />
      </div>
    </div>
  );
}

import type { CalendarEvent, CalendarEventInput } from '../types/calendar.types';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { EditEventForm } from './EditEventForm';

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
export function EventEditPanel({ event, onSave, onClose }: EventEditPanelProps) {
  // Same reasoning as Modal: this component only exists while the panel
  // is open, so the trap is simply active for its whole lifetime.
  const panelRef = useFocusTrap<HTMLDivElement>(true, onClose);

  return (
    <div className="event-panel-overlay" onClick={onClose} role="presentation">
      <div
        ref={panelRef}
        className="event-panel"
        onClick={(clickEvent) => clickEvent.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Event details"
        tabIndex={-1}
      >
        <button type="button" className="event-panel-close" onClick={onClose} aria-label="Close">
          ×
        </button>
        <EditEventForm event={event} onSave={onSave} onCancel={onClose} />
      </div>
    </div>
  );
}

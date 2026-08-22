import { useMemo } from 'react';
import type { CalendarEvent, LegendEntry } from '../types/calendar.types';

interface LegendProps {
  events: CalendarEvent[];
}

export function Legend({ events }: LegendProps) {
  // Deduplicate by category. Built off the `LegendEntry` Pick<CalendarEvent,
  // 'calendar' | 'color'> type, so this stays correct even if CalendarEvent
  // grows more fields later — LegendEntry only ever tracks the two it needs.
  const entries = useMemo(() => {
    const seen = new Map<string, LegendEntry>();
    for (const event of events) {
      if (!seen.has(event.calendar)) {
        seen.set(event.calendar, { calendar: event.calendar, color: event.color });
      }
    }
    return Array.from(seen.values());
  }, [events]);

  return (
    <div className="legend">
      {entries.map((entry) => (
        <span className={`entry ${entry.color}`} key={entry.calendar}>
          {entry.calendar}
        </span>
      ))}
    </div>
  );
}

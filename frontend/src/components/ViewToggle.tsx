import { memo } from "react";
import type { CalendarDisplayMode } from "../types/calendar.types";

interface ViewToggleProps {
  mode: CalendarDisplayMode;
  onChange: (mode: CalendarDisplayMode) => void;
}

// A plain array of the union's members, used to render the buttons without
// hard-coding two near-identical JSX blocks. If `CalendarDisplayMode` ever
// grows a third variant, this list (and the type below) are the only two
// places that need updating — the button rendering itself doesn't change.
const MODES: { value: CalendarDisplayMode; label: string }[] = [
  { value: "month", label: "Month" },
  { value: "schedule", label: "Schedule" },
];

function ViewToggleComponent({ mode, onChange }: ViewToggleProps) {
  return (
    <div className="view-toggle" role="tablist" aria-label="Calendar view">
      {MODES.map((option) => (
        <button
          key={option.value}
          type="button"
          role="tab"
          aria-selected={mode === option.value}
          className={mode === option.value ? "active" : ""}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export const ViewToggle = memo(ViewToggleComponent);

import { memo } from 'react';

interface ScheduleMonthDividerProps {
  label: string;
}

function ScheduleMonthDividerComponent({ label }: ScheduleMonthDividerProps) {
  return (
    <div className="schedule-month-divider">
      <span>{label}</span>
    </div>
  );
}

export const ScheduleMonthDivider = memo(ScheduleMonthDividerComponent);

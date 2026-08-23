import { memo } from 'react';
import { formatMonthYear } from '../utils/dateUtils';

interface CalendarHeaderProps {
  monthAnchor: Date;
}

/**
 * No Prev/Next arrows anymore — both Month and Schedule are continuous
 * scrolls now (see MonthScrollView, ScheduleView), each reporting its own
 * visible-month changes back to `state.current`. There's no click-driven
 * navigation left for arrows to trigger; scrolling — plus each view's own
 * "Today" button — is the only way to move between months in either mode.
 */
function CalendarHeaderComponent({ monthAnchor }: CalendarHeaderProps) {
  return (
    <div className="header">
      <h1>{formatMonthYear(monthAnchor)}</h1>
    </div>
  );
}

// memo here is cheap insurance: the header only depends on the month
// label, so it should never need to re-render when e.g. a day's details
// panel toggles.
export const CalendarHeader = memo(CalendarHeaderComponent);

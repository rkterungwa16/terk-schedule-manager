import { memo } from 'react';
import { formatMonthYear } from '../utils/dateUtils';

interface CalendarHeaderProps {
  monthAnchor: Date;
  /** Omit both to hide the nav arrows entirely — used in Schedule mode,
   *  where the month shown is driven by scroll position rather than a
   *  Prev/Next control, so the arrows wouldn't have anything meaningful
   *  to do. */
  onPrev?: () => void;
  onNext?: () => void;
}

function CalendarHeaderComponent({ monthAnchor, onPrev, onNext }: CalendarHeaderProps) {
  return (
    <div className="header">
      {onPrev && <div className="left" onClick={onPrev} role="button" aria-label="Previous month" />}
      <h1>{formatMonthYear(monthAnchor)}</h1>
      {onNext && <div className="right" onClick={onNext} role="button" aria-label="Next month" />}
    </div>
  );
}

// memo here is cheap insurance: the header only depends on the month label
// and two stable callbacks, so it should never need to re-render when e.g.
// a day's details panel toggles.
export const CalendarHeader = memo(CalendarHeaderComponent);

import { fireEvent } from '@testing-library/react';
import { render, screen } from '../../test/renderWithProviders';
import { Day } from '../Day';
import type { CalendarEvent } from '../../types/calendar.types';

function makeEvent(overrides: Partial<CalendarEvent> = {}): CalendarEvent {
  return {
    id: 'e1',
    eventName: 'Test Event',
    categoryId: 'work',
    date: new Date(2026, 7, 25),
    startTime: '09:00',
    endTime: '10:00',
    recurrence: 'none',
    ...overrides,
  };
}

const MONTH_ANCHOR = new Date(2026, 7, 1);
const TODAY = new Date(2026, 7, 25);

describe('Day', () => {
  it('renders the day name and number', () => {
    render(
      <Day
        date={new Date(2026, 7, 10)}
        monthAnchor={MONTH_ANCHOR}
        today={TODAY}
        events={[]}
        isSelected={false}
        onSelect={jest.fn()}
      />
    );
    expect(screen.getByText('10')).toBeInTheDocument();
  });

  it("calls onSelect with the day's date when clicked", () => {
    const handleSelect = jest.fn();
    const date = new Date(2026, 7, 10);
    render(
      <Day
        date={date}
        monthAnchor={MONTH_ANCHOR}
        today={TODAY}
        events={[]}
        isSelected={false}
        onSelect={handleSelect}
      />
    );
    fireEvent.click(screen.getByRole('button'));
    expect(handleSelect).toHaveBeenCalledWith(date);
  });

  it('marks a day outside the displayed month with the "other" class', () => {
    render(
      <Day
        date={new Date(2026, 6, 31)} // July, while monthAnchor is August
        monthAnchor={MONTH_ANCHOR}
        today={TODAY}
        events={[]}
        isSelected={false}
        onSelect={jest.fn()}
      />
    );
    expect(screen.getByRole('button')).toHaveClass('other');
  });

  it('marks today with the "today" class', () => {
    render(
      <Day
        date={TODAY}
        monthAnchor={MONTH_ANCHOR}
        today={TODAY}
        events={[]}
        isSelected={false}
        onSelect={jest.fn()}
      />
    );
    expect(screen.getByRole('button')).toHaveClass('today');
  });

  it('includes the event count in the accessible label when the day has events', () => {
    render(
      <Day
        date={new Date(2026, 7, 10)}
        monthAnchor={MONTH_ANCHOR}
        today={TODAY}
        events={[makeEvent(), makeEvent({ id: 'e2' })]}
        isSelected={false}
        onSelect={jest.fn()}
      />
    );
    expect(screen.getByRole('button', { name: /2 events/i })).toBeInTheDocument();
  });

  it('caps visible event dots at 4 and shows a "+N" overflow marker beyond that', () => {
    const events = Array.from({ length: 6 }, (_, i) => makeEvent({ id: `e${i}` }));
    render(
      <Day
        date={new Date(2026, 7, 10)}
        monthAnchor={MONTH_ANCHOR}
        today={TODAY}
        events={events}
        isSelected={false}
        onSelect={jest.fn()}
      />
    );
    expect(screen.getByText('+2')).toBeInTheDocument();
  });

  it('does not render event dots for days outside the displayed month', () => {
    const { container } = render(
      <Day
        date={new Date(2026, 6, 31)}
        monthAnchor={MONTH_ANCHOR}
        today={TODAY}
        events={[makeEvent()]}
        isSelected={false}
        onSelect={jest.fn()}
      />
    );
    expect(container.querySelector('.day-events')).not.toBeInTheDocument();
  });
});

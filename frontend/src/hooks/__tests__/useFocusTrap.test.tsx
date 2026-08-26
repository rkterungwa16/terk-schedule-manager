import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useFocusTrap } from '../useFocusTrap';

/**
 * A minimal stand-in for a dialog, rather than testing against Modal or
 * EventEditPanel directly — those pull in CategoriesProvider and full
 * event forms, which would make these tests about the form's behavior
 * as much as the trap's. This isolates exactly what useFocusTrap itself
 * is responsible for.
 */
function TestDialog({ onEscape }: { onEscape?: () => void }) {
  const dialogRef = useFocusTrap<HTMLDivElement>(true, onEscape);
  return (
    <div ref={dialogRef} tabIndex={-1} data-testid="dialog">
      <button>First</button>
      <button>Middle</button>
      <button>Last</button>
    </div>
  );
}

describe('useFocusTrap: trap mechanics', () => {
  it('moves focus to the first focusable element when activated', () => {
    render(<TestDialog />);
    expect(screen.getByText('First')).toHaveFocus();
  });

  it('wraps Tab from the last element back to the first', async () => {
    const user = userEvent.setup();
    render(<TestDialog />);

    screen.getByText('Last').focus();
    await user.tab();

    expect(screen.getByText('First')).toHaveFocus();
  });

  it('wraps Shift+Tab from the first element back to the last', async () => {
    const user = userEvent.setup();
    render(<TestDialog />);

    expect(screen.getByText('First')).toHaveFocus();
    await user.tab({ shift: true });

    expect(screen.getByText('Last')).toHaveFocus();
  });

  it('calls onEscape when Escape is pressed', async () => {
    const user = userEvent.setup();
    const handleEscape = jest.fn();
    render(<TestDialog onEscape={handleEscape} />);

    await user.keyboard('{Escape}');

    expect(handleEscape).toHaveBeenCalledTimes(1);
  });
});

/**
 * Mirrors how Modal and EventEditPanel are actually used: a trigger
 * button opens the dialog (mounting it, which is what activates the
 * trap), and closing it unmounts the dialog again. This is specifically
 * for verifying focus *restoration*, which needs a real "what had focus
 * before the trap activated" to restore to — a dialog that's simply
 * always mounted (as in the tests above) has no such trigger to return to.
 */
function ToggleHarness() {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button onClick={() => setOpen(true)}>Open dialog</button>
      {open && <TestDialog onEscape={() => setOpen(false)} />}
    </div>
  );
}

describe('useFocusTrap: focus restoration', () => {
  it('restores focus to whatever triggered the dialog once it closes', async () => {
    const user = userEvent.setup();
    render(<ToggleHarness />);

    const trigger = screen.getByText('Open dialog');
    await user.click(trigger);
    expect(screen.getByText('First')).toHaveFocus();

    await user.keyboard('{Escape}');
    expect(trigger).toHaveFocus();
  });
});

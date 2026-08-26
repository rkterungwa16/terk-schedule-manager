import userEvent from '@testing-library/user-event';
import { render, screen } from '../../test/renderWithProviders';
import { AddEventForm } from '../AddEventForm';

const DATE = new Date(2026, 7, 25);

describe('AddEventForm', () => {
  it('shows the fixed date as read-only text, with no date input at all', () => {
    render(<AddEventForm initialDate={DATE} onSubmit={jest.fn()} onCancel={jest.fn()} />);
    expect(screen.getByText(/august 25, 2026/i)).toBeInTheDocument();
    expect(document.querySelector('input[type="date"]')).not.toBeInTheDocument();
  });

  it('shows a validation error and does not submit when the name is empty', async () => {
    const user = userEvent.setup();
    const handleSubmit = jest.fn();
    render(<AddEventForm initialDate={DATE} onSubmit={handleSubmit} onCancel={jest.fn()} />);

    await user.click(screen.getByRole('button', { name: /add event/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/event name is required/i);
    expect(handleSubmit).not.toHaveBeenCalled();
  });

  it('rejects an end time that is not after the start time', async () => {
    const user = userEvent.setup();
    const handleSubmit = jest.fn();
    render(<AddEventForm initialDate={DATE} onSubmit={handleSubmit} onCancel={jest.fn()} />);

    await user.type(screen.getByLabelText(/event name/i), 'Lunch');
    await user.clear(screen.getByLabelText(/end time/i));
    await user.type(screen.getByLabelText(/end time/i), '08:00'); // before the default 09:00 start
    await user.click(screen.getByRole('button', { name: /add event/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/end time must be after/i);
    expect(handleSubmit).not.toHaveBeenCalled();
  });

  it('submits a valid event with the fixed date and trimmed name', async () => {
    const user = userEvent.setup();
    const handleSubmit = jest.fn();
    render(<AddEventForm initialDate={DATE} onSubmit={handleSubmit} onCancel={jest.fn()} />);

    await user.type(screen.getByLabelText(/event name/i), '  Lunch with Mark  ');
    await user.click(screen.getByRole('button', { name: /add event/i }));

    expect(handleSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        eventName: 'Lunch with Mark',
        date: DATE,
        recurrence: 'none',
        startTime: '09:00',
        endTime: '10:00',
      })
    );
  });

  it('calls onCancel when Cancel is clicked', async () => {
    const user = userEvent.setup();
    const handleCancel = jest.fn();
    render(<AddEventForm initialDate={DATE} onSubmit={jest.fn()} onCancel={handleCancel} />);

    await user.click(screen.getByRole('button', { name: /^cancel$/i }));

    expect(handleCancel).toHaveBeenCalled();
  });

  it('lets the user create a new category inline and selects it for the event', async () => {
    const user = userEvent.setup();
    render(<AddEventForm initialDate={DATE} onSubmit={jest.fn()} onCancel={jest.fn()} />);

    await user.selectOptions(screen.getByLabelText(/^category$/i), '+ Add new category…');
    await user.type(screen.getByPlaceholderText(/category name/i), 'Health');
    await user.click(screen.getByRole('radio', { name: '#3e8e8e' }));
    await user.click(screen.getByRole('button', { name: /create category/i }));

    // The category select reappears (the create-category sub-form closes)
    // with the freshly created category already chosen.
    expect(screen.getByRole('combobox', { name: /^category$/i })).toHaveDisplayValue('Health');
  });

  it('disables "Create category" until a name is entered', async () => {
    const user = userEvent.setup();
    render(<AddEventForm initialDate={DATE} onSubmit={jest.fn()} onCancel={jest.fn()} />);

    await user.selectOptions(screen.getByLabelText(/^category$/i), '+ Add new category…');

    expect(screen.getByRole('button', { name: /create category/i })).toBeDisabled();
  });
});

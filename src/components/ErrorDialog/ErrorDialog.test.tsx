import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ErrorDialog from './ErrorDialog';

const message = 'Unable to reach the medication service. Check your connection and try again.';

describe('ErrorDialog', () => {
  it('shows the default title and the message when open', () => {
    render(<ErrorDialog open message={message} onClose={vi.fn()} />);

    const dialog = screen.getByRole('dialog', { name: 'Something went wrong' });
    expect(dialog).toHaveAccessibleDescription(message);
  });

  it('supports a custom title', () => {
    render(<ErrorDialog open title="Search unavailable" message={message} onClose={vi.fn()} />);

    expect(screen.getByRole('dialog', { name: 'Search unavailable' })).toBeInTheDocument();
  });

  it('calls onClose when dismissed', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<ErrorDialog open message={message} onClose={onClose} />);

    await user.click(screen.getByRole('button', { name: 'OK' }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('renders nothing when closed', () => {
    render(<ErrorDialog open={false} message={message} onClose={vi.fn()} />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});

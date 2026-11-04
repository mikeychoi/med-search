import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ConfirmDialog from './ConfirmDialog';

function setup() {
  const onConfirm = vi.fn();
  const onClose = vi.fn();
  render(
    <ConfirmDialog
      open
      title="Delete “Pain Relief”?"
      message="This can’t be undone."
      confirmLabel="Delete"
      onConfirm={onConfirm}
      onClose={onClose}
    />,
  );
  return { user: userEvent.setup(), onConfirm, onClose };
}

describe('ConfirmDialog', () => {
  it('shows the title and message, focusing Cancel', () => {
    setup();

    const dialog = screen.getByRole('dialog', { name: 'Delete “Pain Relief”?' });
    expect(dialog).toHaveAccessibleDescription('This can’t be undone.');
    expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus();
  });

  it('calls onConfirm when the confirm button is pressed', async () => {
    const { user, onConfirm, onClose } = setup();

    await user.click(screen.getByRole('button', { name: 'Delete' }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onClose).not.toHaveBeenCalled();
  });

  it('calls onClose when canceled', async () => {
    const { user, onConfirm, onClose } = setup();

    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });
});

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CreateListDialog from './CreateListDialog';

function setup(onCreate = vi.fn<(name: string) => string | undefined>()) {
  const onClose = vi.fn();
  const user = userEvent.setup();
  render(<CreateListDialog open onCreate={onCreate} onClose={onClose} />);
  return {
    user,
    onCreate,
    onClose,
    input: () => screen.getByRole('textbox', { name: 'List name' }),
  };
}

describe('CreateListDialog', () => {
  it('passes the entered name to onCreate', async () => {
    const { user, onCreate, input } = setup();

    await user.type(input(), 'Pain Relief');
    await user.click(screen.getByRole('button', { name: 'Create' }));

    expect(onCreate).toHaveBeenCalledWith('Pain Relief');
  });

  it('disables Create until a non-blank name is entered', async () => {
    const { user, onCreate, input } = setup();
    const create = screen.getByRole('button', { name: 'Create' });

    expect(create).toBeDisabled();
    await user.type(input(), '  {Enter}');
    expect(create).toBeDisabled();
    expect(onCreate).not.toHaveBeenCalled();

    await user.type(input(), 'a');
    expect(create).toBeEnabled();
  });

  it('shows the message returned by onCreate until the name is edited', async () => {
    const { user, input } = setup(vi.fn(() => 'A list named “Pain Relief” already exists.'));

    await user.type(input(), 'Pain Relief{Enter}');
    expect(input()).toHaveAccessibleDescription('A list named “Pain Relief” already exists.');

    await user.type(input(), '!');
    expect(input()).not.toHaveAccessibleDescription();
  });

  it('calls onClose when canceled', async () => {
    const { user, onCreate, onClose } = setup();

    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onCreate).not.toHaveBeenCalled();
  });
});

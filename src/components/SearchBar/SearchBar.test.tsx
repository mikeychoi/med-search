import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SearchBar from './SearchBar';

function setup(loading = false) {
  const onSearch = vi.fn();
  const user = userEvent.setup();
  const utils = render(<SearchBar onSearch={onSearch} loading={loading} />);
  const input = screen.getByRole('textbox', { name: 'Search medications' });
  return { ...utils, onSearch, user, input };
}

describe('SearchBar', () => {
  it('shows the placeholder and a search button', () => {
    const { input } = setup();

    expect(input).toHaveAttribute('placeholder', 'Search for medications…');
    expect(screen.getByRole('button', { name: 'Search' })).toBeInTheDocument();
  });

  it('submits the trimmed query when Enter is pressed', async () => {
    const { input, onSearch, user } = setup();

    await user.type(input, '  ibuprofen  {Enter}');

    expect(onSearch).toHaveBeenCalledTimes(1);
    expect(onSearch).toHaveBeenCalledWith('ibuprofen');
  });

  it('submits the query when the search button is clicked', async () => {
    const { input, onSearch, user } = setup();

    await user.type(input, 'Tylenol');
    await user.click(screen.getByRole('button', { name: 'Search' }));

    expect(onSearch).toHaveBeenCalledWith('Tylenol');
  });

  it('does not submit an empty or whitespace-only query', async () => {
    const { input, onSearch, user } = setup();

    expect(screen.getByRole('button', { name: 'Search' })).toBeDisabled();
    await user.type(input, '   {Enter}');

    expect(screen.getByRole('button', { name: 'Search' })).toBeDisabled();
    expect(onSearch).not.toHaveBeenCalled();
  });

  it('disables the button and ignores submissions while loading', async () => {
    const { input, onSearch, user, rerender } = setup();
    await user.type(input, 'ibuprofen');

    rerender(<SearchBar onSearch={onSearch} loading />);
    const button = screen.getByRole('button', { name: 'Searching…' });

    expect(button).toBeDisabled();
    await user.type(input, '{Enter}');
    expect(onSearch).not.toHaveBeenCalled();
  });
});

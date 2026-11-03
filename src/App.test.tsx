import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import App from './App';
import { theme } from './theme';

function renderApp(initialPath = '/') {
  return render(
    <ThemeProvider theme={theme}>
      <MemoryRouter initialEntries={[initialPath]}>
        <App />
      </MemoryRouter>
    </ThemeProvider>,
  );
}

describe('App', () => {
  it('renders the Search page by default', () => {
    renderApp();

    expect(screen.getByRole('heading', { name: 'Medication Search' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Search' })).toHaveAttribute('aria-selected', 'true');
  });

  it('navigates between the Search and Lists pages', async () => {
    const user = userEvent.setup();
    renderApp();

    await user.click(screen.getByRole('tab', { name: 'Lists' }));
    expect(screen.getByRole('heading', { name: 'Prescription Lists' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Lists' })).toHaveAttribute('aria-selected', 'true');

    await user.click(screen.getByRole('tab', { name: 'Search' }));
    expect(screen.getByRole('heading', { name: 'Medication Search' })).toBeInTheDocument();
  });

  it('redirects unknown routes to the Search page', () => {
    renderApp('/does-not-exist');

    expect(screen.getByRole('heading', { name: 'Medication Search' })).toBeInTheDocument();
  });
});

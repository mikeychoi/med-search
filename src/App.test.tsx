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

// jsdom has no matchMedia, so MUI's useMediaQuery reports false (mobile layout)
// unless a test stubs it.
function mockDesktopViewport() {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: true,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('App', () => {
  it('renders the Search page by default', () => {
    renderApp();

    expect(screen.getByRole('heading', { name: 'Medication Search' })).toBeInTheDocument();
  });

  it('redirects unknown routes to the Search page', () => {
    renderApp('/does-not-exist');

    expect(screen.getByRole('heading', { name: 'Medication Search' })).toBeInTheDocument();
  });

  describe('on mobile', () => {
    it('hides the sidebar until the menu button is pressed', async () => {
      const user = userEvent.setup();
      renderApp();
      const menuButton = screen.getByRole('button', { name: 'Toggle navigation' });

      expect(menuButton).toHaveAttribute('aria-expanded', 'false');
      expect(screen.queryByRole('link', { name: 'Lists' })).not.toBeInTheDocument();

      await user.click(menuButton);

      expect(menuButton).toHaveAttribute('aria-expanded', 'true');
      expect(screen.getByRole('link', { name: 'Lists' })).toBeInTheDocument();
    });

    it('navigates to a page and closes the sidebar', async () => {
      const user = userEvent.setup();
      renderApp();
      const menuButton = screen.getByRole('button', { name: 'Toggle navigation' });

      await user.click(menuButton);
      await user.click(screen.getByRole('link', { name: 'Lists' }));

      expect(menuButton).toHaveAttribute('aria-expanded', 'false');
      // The page stays aria-hidden until the drawer's exit transition finishes.
      expect(
        await screen.findByRole('heading', { name: 'Prescription Lists' }),
      ).toBeInTheDocument();
    });
  });

  describe('on desktop', () => {
    beforeEach(mockDesktopViewport);

    it('shows the sidebar expanded and navigates between pages', async () => {
      const user = userEvent.setup();
      renderApp();

      expect(screen.getByRole('button', { name: 'Toggle navigation' })).toHaveAttribute(
        'aria-expanded',
        'true',
      );
      expect(screen.getByRole('link', { name: 'Search' })).toHaveAttribute('aria-current', 'page');

      await user.click(screen.getByRole('link', { name: 'Lists' }));

      expect(screen.getByRole('heading', { name: 'Prescription Lists' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Lists' })).toHaveAttribute('aria-current', 'page');
      expect(screen.getByRole('link', { name: 'Search' })).not.toHaveAttribute('aria-current');
    });

    it('collapses to icons while keeping the links available', async () => {
      const user = userEvent.setup();
      renderApp();
      const menuButton = screen.getByRole('button', { name: 'Toggle navigation' });

      await user.click(menuButton);

      expect(menuButton).toHaveAttribute('aria-expanded', 'false');
      expect(screen.getByRole('link', { name: 'Search' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Lists' })).toBeInTheDocument();
    });
  });
});

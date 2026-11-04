import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import List from '@mui/material/List';
import type { MedicationList } from '../../types/medication';
import ListSummaryRow from './ListSummaryRow';

const list: MedicationList = {
  id: 'list-1',
  name: 'Pain Relief',
  medications: [
    { rxcui: '310965', name: 'ibuprofen 200 MG Oral Tablet', termType: 'SCD' },
    { rxcui: '313782', name: 'acetaminophen 325 MG Oral Tablet', termType: 'SCD' },
  ],
  createdAt: '2026-10-28T14:30:00.000Z',
  updatedAt: '2026-11-02T09:15:00.000Z',
};

const formatDate = (iso: string) =>
  new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(iso));

function renderRow({
  rowList = list,
  expanded = false,
  onToggle = vi.fn(),
  onDelete = vi.fn(),
} = {}) {
  const row = (isExpanded: boolean) => (
    <List>
      <ListSummaryRow
        list={rowList}
        expanded={isExpanded}
        onToggle={onToggle}
        contentsId="contents"
        onDelete={onDelete}
      />
    </List>
  );
  const { rerender } = render(row(expanded));
  return { onToggle, onDelete, setExpanded: (value: boolean) => rerender(row(value)) };
}

describe('ListSummaryRow', () => {
  it('is a toggle button that reports presses and reflects the expanded state', async () => {
    const user = userEvent.setup();
    const { onToggle, setExpanded } = renderRow();

    const toggle = screen.getByRole('button', { name: /^Pain Relief/ });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(toggle).toHaveAttribute('aria-controls', 'contents');
    await user.click(toggle);
    expect(onToggle).toHaveBeenCalledTimes(1);

    setExpanded(true);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
  });

  it('shows the medication count and created and updated dates', () => {
    renderRow();

    expect(
      screen.getByText(
        `2 medications · Created ${formatDate(list.createdAt)} · Updated ${formatDate(list.updatedAt)}`,
      ),
    ).toBeInTheDocument();
  });

  it('uses the singular for one medication and handles invalid dates', () => {
    renderRow({
      rowList: { ...list, medications: [list.medications[0]], updatedAt: 'not a date' },
    });

    expect(screen.getByText(/^1 medication · /)).toHaveTextContent('Updated Unknown');
  });

  it('calls onDelete with the list when the delete button is pressed', async () => {
    const user = userEvent.setup();
    const { onDelete } = renderRow();

    await user.click(screen.getByRole('button', { name: 'Delete Pain Relief' }));

    expect(onDelete).toHaveBeenCalledWith(list);
  });
});

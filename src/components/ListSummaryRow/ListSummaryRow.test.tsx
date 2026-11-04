import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
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

function renderRow(rowList: MedicationList = list, onDelete = vi.fn()) {
  render(
    <MemoryRouter>
      <List>
        <ListSummaryRow list={rowList} to="/lists/list-1" onDelete={onDelete} />
      </List>
    </MemoryRouter>,
  );
  return onDelete;
}

describe('ListSummaryRow', () => {
  it('links the list name to the given route', () => {
    renderRow();

    expect(screen.getByRole('link', { name: /Pain Relief/ })).toHaveAttribute(
      'href',
      '/lists/list-1',
    );
  });

  it('renders the name as plain text when no route is given', () => {
    render(
      <List>
        <ListSummaryRow list={list} onDelete={vi.fn()} />
      </List>,
    );

    expect(screen.getByText('Pain Relief')).toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
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
    renderRow({ ...list, medications: [list.medications[0]], updatedAt: 'not a date' });

    expect(screen.getByText(/^1 medication · /)).toHaveTextContent('Updated Unknown');
  });

  it('calls onDelete with the list when the delete button is pressed', async () => {
    const user = userEvent.setup();
    const onDelete = renderRow();

    await user.click(screen.getByRole('button', { name: 'Delete Pain Relief' }));

    expect(onDelete).toHaveBeenCalledWith(list);
  });
});

import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { EmployeeCatalogManager } from './EmployeeCatalogManager';

// El setup global mockea @tanstack/react-table; este test necesita la librería
// REAL para que el DataTable renderice filas y celdas.
vi.mock('@tanstack/react-table', async (importOriginal) => {
  const actual = await importOriginal();
  return actual;
});

const FIXTURE_ROWS = [
  {
    id: 1,
    code: 'POS-0001',
    name: 'Analista',
    active: true,
    createdOn: '2026-01-05T10:00:00',
    updatedOn: null,
  },
];

/** Stable fake config: one hook identity per test, as the real config has. */
const makeConfig = ({ rows = FIXTURE_ROWS } = {}) => {
  const triggerList = vi.fn();
  const createRecord = vi.fn(() => ({ unwrap: () => Promise.resolve({}) }));
  const updateRecord = vi.fn(() => ({ unwrap: () => Promise.resolve({}) }));
  const deleteRecord = vi.fn(() => ({ unwrap: () => Promise.resolve({}) }));

  const config = {
    kind: 'position',
    addTitleKey: 'add_position',
    editTitleKey: 'edit_position',
    useLazyList: () => [
      triggerList,
      {
        data: { data: { dataList: rows, total: rows.length } },
        isLoading: false,
        isFetching: false,
      },
    ],
    useCreate: () => [createRecord, { isLoading: false }],
    useUpdate: () => [updateRecord, { isLoading: false }],
    useDelete: () => [deleteRecord, { isLoading: false }],
  };

  return { config, triggerList, createRecord, updateRecord, deleteRecord };
};

describe('EmployeeCatalogManager - UI', () => {
  it('renders the catalog rows with their status', () => {
    const { config, triggerList } = makeConfig();
    render(<EmployeeCatalogManager config={config} />);

    expect(screen.getByText('POS-0001')).toBeInTheDocument();
    expect(screen.getByText('Analista')).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: 'Active' })).toBeInTheDocument();
    expect(triggerList).toHaveBeenCalledWith({ page: 1, limit: 20 });
  });

  it('creates a catalog row from the add dialog', async () => {
    const user = userEvent.setup();
    const { config, createRecord } = makeConfig();
    render(<EmployeeCatalogManager config={config} />);

    await user.click(screen.getByRole('button', { name: /^add$/i }));

    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText('Add position')).toBeInTheDocument();

    await user.type(within(dialog).getByLabelText(/code/i), 'POS-0002');
    await user.type(within(dialog).getByLabelText(/name/i), 'Desarrollador');
    await user.click(within(dialog).getByRole('button', { name: /^save$/i }));

    await waitFor(() =>
      expect(createRecord).toHaveBeenCalledWith({
        code: 'POS-0002',
        name: 'Desarrollador',
        active: true,
      })
    );
  });

  it('deletes a catalog row after confirmation', async () => {
    const user = userEvent.setup();
    const { config, deleteRecord } = makeConfig();
    render(<EmployeeCatalogManager config={config} />);

    await user.click(screen.getByText('POS-0001'));
    const dialog = screen.getByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: /^delete$/i }));

    const confirm = screen.getByRole('alertdialog');
    await user.click(
      within(confirm).getByRole('button', { name: /^delete$/i })
    );

    await waitFor(() => expect(deleteRecord).toHaveBeenCalledWith(1));
  });
});

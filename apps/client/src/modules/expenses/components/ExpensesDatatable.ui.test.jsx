import { render } from '@testing-library/react';
import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { ExpensesDatatable } from './ExpensesDatatable';

// El setup global mockea @tanstack/react-table; este snapshot necesita la
// librería REAL para renderizar cabeceras, filtros y las 3 filas fixture.
vi.mock('@tanstack/react-table', async (importOriginal) => {
  const actual = await importOriginal();
  return actual;
});

beforeAll(() => {
  vi.setSystemTime(new Date(2026, 0, 15));
});

afterAll(() => {
  vi.useRealTimers();
});

// Fechas SIN sufijo Z (hora local): date-fns `PPP` imprime el mismo día en
// cualquier zona horaria (local y CI = UTC).
const FIXTURE_ROWS = [
  {
    id: 1,
    description: 'Office supplies',
    total: 150.5,
    category: 'operations',
    userExpenseCreatedName: 'Oliver Ops',
    createdOn: '2026-01-05T10:00:00',
    userExpenseUpdatedName: 'Oliver Ops',
    updatedOn: '2026-01-06T10:00:00',
  },
  {
    id: 2,
    description: 'Team lunch',
    total: 80,
    category: 'meals',
    userExpenseCreatedName: 'Ivy Inspector',
    createdOn: '2026-01-06T10:00:00',
    userExpenseUpdatedName: null,
    updatedOn: null,
  },
  {
    id: 3,
    description: 'Cloud hosting',
    total: 320.75,
    category: 'infrastructure',
    userExpenseCreatedName: 'Oliver Ops',
    createdOn: '2026-01-07T10:00:00',
    userExpenseUpdatedName: 'Ivy Inspector',
    updatedOn: '2026-01-08T10:00:00',
  },
];

const renderDatatable = () =>
  render(
    <ExpensesDatatable
      dataExpenses={{ dataList: FIXTURE_ROWS, total: FIXTURE_ROWS.length }}
      onEditDialog={() => {}}
      pagination={{ pageIndex: 0, pageSize: 10 }}
      onPaginationChange={() => {}}
    />
  );

describe('ExpensesDatatable - UI snapshot', () => {
  // Segmentación (D7 + tasks 3.2): una entrada por cabecera y por fila,
  // cada una muy por debajo de ~100 líneas.
  it('renders each column header with its filter', () => {
    const { container } = renderDatatable();
    container.querySelectorAll('thead th').forEach((th, index) => {
      expect(th).toMatchSnapshot(
        `column header ${index + 1} with sort and filter`
      );
    });
  });

  it('renders each frozen fixture row', () => {
    const { container } = renderDatatable();
    container.querySelectorAll('tbody tr').forEach((row, index) => {
      expect(row).toMatchSnapshot(`fixture row ${index + 1} with cells`);
    });
  });

  it('renders the pagination controls', () => {
    const { container } = renderDatatable();
    expect(
      container.querySelector('.flex.flex-wrap.items-center.gap-2')
    ).toMatchSnapshot('pagination buttons and page size select');

    expect(container.firstChild.lastElementChild).toMatchSnapshot(
      'pagination showing row count'
    );
  });
});

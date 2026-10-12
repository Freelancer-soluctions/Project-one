import { render } from '@testing-library/react';
import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { NewsDatatable } from './NewsDatatable';

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

// Los date cells de news llaman format(value, ...) directamente, así que las
// fechas deben ser objetos Date (no strings). Se construyen en hora local
// para que el formateo sea idéntico en cualquier zona horaria.
const FIXTURE_ROWS = [
  {
    id: 1,
    createdOn: new Date(2026, 0, 5, 9, 30, 0),
    description: 'Scheduled maintenance window announcement for all tenants',
    status: { description: 'Pending' },
    userNewsCreated: { name: 'Oliver Ops' },
    userNewsPending: { name: 'Ivy Inspector' },
    pendingOn: new Date(2026, 0, 5, 14, 30, 0),
    userNewsClosed: null,
    closedOn: null,
  },
  {
    id: 2,
    createdOn: new Date(2026, 0, 6, 11, 0, 0),
    description: 'Short note',
    status: { description: 'Closed' },
    userNewsCreated: { name: 'Ivy Inspector' },
    userNewsPending: null,
    pendingOn: null,
    userNewsClosed: { name: 'Oliver Ops' },
    closedOn: new Date(2026, 0, 7, 16, 45, 30),
  },
  {
    id: 3,
    createdOn: new Date(2026, 0, 8, 8, 15, 0),
    description: 'Another announcement with a fairly long description',
    status: { description: 'Published' },
    userNewsCreated: { name: 'Oliver Ops' },
    userNewsPending: { name: 'Oliver Ops' },
    pendingOn: new Date(2026, 0, 8, 10, 0, 0),
    userNewsClosed: { name: 'Ivy Inspector' },
    closedOn: new Date(2026, 0, 9, 12, 0, 0),
  },
];

const renderDatatable = () =>
  render(
    <NewsDatatable
      dataNews={{
        data: { dataList: FIXTURE_ROWS, total: FIXTURE_ROWS.length },
      }}
      setSelectedRow={() => {}}
      setOpenDialog={() => {}}
      setActionDialog={() => {}}
      pagination={{ pageIndex: 0, pageSize: 10 }}
      onPaginationChange={() => {}}
    />
  );

describe('NewsDatatable - UI snapshot', () => {
  // Segmentación (D7 + tasks 3.3): una entrada por cabecera y por fila.
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

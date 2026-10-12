import { render } from '@testing-library/react';
import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { VacationDatatable } from './VacationDatatable';

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

// startDate/endDate llaman format() directamente → no nulos. Fechas sin Z
// = hora local, PPP idéntico en local y CI (UTC). El status renderiza un
// Badge con la traducción `status.<valor>` (i18n fijo a en por setup).
const FIXTURE_ROWS = [
  {
    id: 1,
    employee: { name: 'Alice', lastName: 'Anders' },
    startDate: '2026-02-02T10:00:00',
    endDate: '2026-02-06T10:00:00',
    status: 'approved',
    userVacationCreatedName: 'Oliver Ops',
    createdOn: '2026-01-05T10:00:00',
    userVacationUpdatedName: 'Oliver Ops',
    updatedOn: '2026-01-06T10:00:00',
  },
  {
    id: 2,
    employee: { name: 'Bob', lastName: 'Bright' },
    startDate: '2026-03-09T10:00:00',
    endDate: '2026-03-13T10:00:00',
    status: 'pending',
    userVacationCreatedName: 'Ivy Inspector',
    createdOn: '2026-01-06T10:00:00',
    userVacationUpdatedName: null,
    updatedOn: null,
  },
  {
    id: 3,
    employee: { name: 'Cara', lastName: 'Chen' },
    startDate: '2026-04-01T10:00:00',
    endDate: '2026-04-02T10:00:00',
    status: 'rejected',
    userVacationCreatedName: 'Oliver Ops',
    createdOn: '2026-01-07T10:00:00',
    userVacationUpdatedName: 'Ivy Inspector',
    updatedOn: '2026-01-08T10:00:00',
  },
];

const renderDatatable = () =>
  render(
    <VacationDatatable
      dataVacations={{
        data: { dataList: FIXTURE_ROWS, total: FIXTURE_ROWS.length },
      }}
      onEditDialog={() => {}}
      pagination={{ pageIndex: 0, pageSize: 10 }}
      onPaginationChange={() => {}}
    />
  );

describe('VacationDatatable - UI snapshot', () => {
  // Segmentación (D7 + tasks 3.5): una entrada por cabecera y por fila.
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

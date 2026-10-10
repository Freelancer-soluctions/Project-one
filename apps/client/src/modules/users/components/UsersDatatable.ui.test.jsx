import { render } from '@testing-library/react';
import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { UsersDatatable } from './UsersDatatable';

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

// startDate/birthday llaman format() directamente → no nulos. Fechas sin Z
// = hora local, PPP idéntico en local y CI (UTC).
const FIXTURE_ROWS = [
  {
    id: 1,
    startDate: '2024-03-01T10:00:00',
    name: 'Alice Anders',
    statusDescription: 'Active',
    roleDescription: 'Admin',
    email: 'alice@example.com',
    telephone: '+57 300 111 2233',
    state: 'Antioquia',
    address: 'Calle 10 # 20-30, Medellin',
    birthday: '1990-07-12T10:00:00',
    lastUpdatedByName: 'Oliver Ops',
    lastUpdatedOn: '2026-01-06T10:00:00',
  },
  {
    id: 2,
    startDate: '2025-06-15T10:00:00',
    name: 'Bob Bright',
    statusDescription: 'Inactive',
    roleDescription: 'Operator',
    email: 'bob@example.com',
    telephone: '+57 300 444 5566',
    state: 'Bogota',
    address: 'Avenida 5 # 6-70',
    birthday: '1995-11-30T10:00:00',
    lastUpdatedByName: null,
    lastUpdatedOn: null,
  },
  {
    id: 3,
    startDate: '2026-01-05T10:00:00',
    name: 'Cara Chen',
    statusDescription: 'Active',
    roleDescription: 'Viewer',
    email: 'cara@example.com',
    telephone: '+57 300 777 8899',
    state: 'Valle del Cauca',
    address: 'Carrera 3 # 4-50, Cali',
    birthday: '1988-02-20T10:00:00',
    lastUpdatedByName: 'Ivy Inspector',
    lastUpdatedOn: '2026-01-08T10:00:00',
  },
];

const renderDatatable = () =>
  render(
    <UsersDatatable
      dataUsers={{
        data: { dataList: FIXTURE_ROWS, total: FIXTURE_ROWS.length },
      }}
      onOpenUsersForms={() => {}}
      pagination={{ pageIndex: 0, pageSize: 10 }}
      onPaginationChange={() => {}}
    />
  );

describe('UsersDatatable - UI snapshot', () => {
  // Segmentación (D7 + tasks 3.5): una entrada por cabecera y por fila. Con
  // 12 columnas esta es la tabla más ancha del repo; por eso cada cabecera
  // y cada fila se captura por separado.
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

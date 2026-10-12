import { render } from '@testing-library/react';
import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { EmployeesDatatable } from './EmployeesDatatable';

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

// Fechas sin Z = hora local (PPP idéntico en local y CI). El salario se
// formatea con Intl es-CO/COP, determinista para un mismo build de Node.
const FIXTURE_ROWS = [
  {
    id: 1,
    name: 'Alice',
    lastName: 'Anders',
    dni: '100111222',
    email: 'alice@example.com',
    position: 'Engineer',
    department: 'R&D',
    salary: 4500000,
    userEmployeeCreatedName: 'Oliver Ops',
    createdOn: '2026-01-05T10:00:00',
    userEmployeeUpdatedName: 'Oliver Ops',
    updatedOn: '2026-01-06T10:00:00',
  },
  {
    id: 2,
    name: 'Bob',
    lastName: 'Bright',
    dni: '100333444',
    email: 'bob@example.com',
    position: 'Designer',
    department: 'Product',
    salary: 3800000,
    userEmployeeCreatedName: 'Oliver Ops',
    createdOn: '2026-01-06T10:00:00',
    userEmployeeUpdatedName: null,
    updatedOn: null,
  },
  {
    id: 3,
    name: 'Cara',
    lastName: 'Chen',
    dni: '100555666',
    email: 'cara@example.com',
    position: 'Analyst',
    department: 'Finance',
    salary: 5200000,
    userEmployeeCreatedName: 'Ivy Inspector',
    createdOn: '2026-01-07T10:00:00',
    userEmployeeUpdatedName: 'Ivy Inspector',
    updatedOn: '2026-01-08T10:00:00',
  },
];

const renderDatatable = () =>
  render(
    <EmployeesDatatable
      dataEmployees={{ dataList: FIXTURE_ROWS, total: FIXTURE_ROWS.length }}
      onEditDialog={() => {}}
      pagination={{ pageIndex: 0, pageSize: 10 }}
      onPaginationChange={() => {}}
    />
  );

describe('EmployeesDatatable - UI snapshot', () => {
  // Segmentación (D7 + tasks 3.3): una entrada por cabecera y por fila,
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

import { render } from '@testing-library/react';
import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { AttendanceDatatable } from './AttendanceDatatable';

// El setup global mockea @tanstack/react-table (aislamiento de
// DataTable.unit.test/CellWithTooltip.unit.test). Este snapshot necesita la
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

// Fixture congelada: 3 filas con fechas SIN sufijo Z (hora local) para que
// date-fns `PPP` imprima el mismo día en cualquier zona horaria (local y CI).
const FIXTURE_ROWS = [
  {
    id: 1,
    employeeName: 'Alice Anders',
    date: '2026-01-05T00:00:00',
    entryTime: '08:00',
    exitTime: '17:00',
    workedHours: 8.5,
    userAttendanceCreatedName: 'Oliver Ops',
    createdOn: '2026-01-05T10:00:00',
    userAttendanceUpdatedName: 'Oliver Ops',
    updatedOn: '2026-01-06T10:00:00',
  },
  {
    id: 2,
    employeeName: 'Bob Bright',
    date: '2026-01-06T00:00:00',
    entryTime: '09:15',
    exitTime: '18:30',
    workedHours: 9.25,
    userAttendanceCreatedName: 'Oliver Ops',
    createdOn: '2026-01-06T10:00:00',
    userAttendanceUpdatedName: null,
    updatedOn: null,
  },
  {
    id: 3,
    employeeName: 'Cara Chen',
    date: '2026-01-07T00:00:00',
    entryTime: '07:45',
    exitTime: '16:15',
    workedHours: 8,
    userAttendanceCreatedName: 'Ivy Inspector',
    createdOn: '2026-01-07T10:00:00',
    userAttendanceUpdatedName: 'Ivy Inspector',
    updatedOn: '2026-01-08T10:00:00',
  },
];

const renderDatatable = () =>
  render(
    <AttendanceDatatable
      dataAttendance={{ dataList: FIXTURE_ROWS, total: FIXTURE_ROWS.length }}
      onEditDialog={() => {}}
      pagination={{ pageIndex: 0, pageSize: 10 }}
      onPaginationChange={() => {}}
    />
  );

describe('AttendanceDatatable - UI snapshot', () => {
  // Segmentación (D7 + tasks 3.2): una entrada por cabecera de columna y por
  // fila fixture, cada una muy por debajo de ~100 líneas.
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
      expect(row).toMatchSnapshot(
        `fixture row ${index + 1} with formatted cells`
      );
    });
  });

  it('renders the pagination controls', () => {
    const { container } = renderDatatable();
    expect(
      container.querySelector('.flex.flex-wrap.items-center.gap-2')
    ).toMatchSnapshot(
      'pagination buttons, page indicator and page size select'
    );

    expect(container.firstChild.lastElementChild).toMatchSnapshot(
      'pagination showing row count'
    );
  });
});

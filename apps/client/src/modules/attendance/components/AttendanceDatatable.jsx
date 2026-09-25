import { useTranslation } from 'react-i18next';
import { DataTable } from '@/components/dataTable';
import { format } from 'date-fns';
import PropTypes from 'prop-types';

/** Cell renderer for uppercase text. */
const buildUppercaseCell = (info) => info.getValue()?.toUpperCase();

/** Cell renderer for formatted dates (null keeps the cell empty). */
const buildFormattedDateCell = (info) => {
  const date = info.getValue();
  return date ? format(new Date(date), 'PPP') : null;
};

/** Cell renderer for hours formatted to 2 decimals when numeric. */
const buildWorkedHoursCell = (info) => {
  const hours = info.getValue();
  // Format to 2 decimal places if it's a number
  return typeof hours === 'number' ? hours.toFixed(2) : hours;
};

/** Cell renderer for user-name columns (uppercase, empty when absent). */
const buildRowNameCell = (rowKey) => (info) => {
  const name = info.row.original[rowKey]; // Accede al dato original de la fila
  return name ? name.toUpperCase() : null; // null mantiene la celda vacía
};

/** Column definitions for the attendance table. */
const buildAttendanceColumns = (t) => [
  {
    accessorKey: 'employeeName',
    header: t('employee'),
    cell: buildUppercaseCell,
  },
  {
    accessorKey: 'date',
    header: t('date'),
    cell: (info) => format(new Date(info.getValue()), 'PPP'),
  },
  {
    accessorKey: 'entryTime',
    header: t('entry_time'),
    cell: (info) => info.getValue(),
  },
  {
    accessorKey: 'exitTime',
    header: t('exit_time'),
    cell: (info) => info.getValue(),
  },
  {
    accessorKey: 'workedHours',
    header: t('worked_hours'),
    cell: buildWorkedHoursCell,
  },
  {
    accessorKey: 'userAttendanceCreatedName',
    header: t('created_by'),
    cell: buildRowNameCell('userAttendanceCreatedName'),
  },
  {
    accessorKey: 'createdOn',
    header: t('created_on'),
    cell: buildFormattedDateCell,
  },
  {
    accessorKey: 'userAttendanceUpdatedName',
    header: t('created_by'),
    cell: buildRowNameCell('userAttendanceUpdatedName'),
  },
  {
    accessorKey: 'updatedOn',
    header: t('updated_on'),
    cell: buildFormattedDateCell,
  },
];

export const AttendanceDatatable = ({
  dataAttendance,
  onEditDialog,
  pagination,
  onPaginationChange,
}) => {
  const { t } = useTranslation();
  const { dataList, total } = dataAttendance;

  return (
    <DataTable
      columns={buildAttendanceColumns(t)}
      data={dataList}
      totalRows={total}
      handleRow={onEditDialog}
      pagination={pagination}
      onPaginationChange={onPaginationChange}
    />
  );
};

AttendanceDatatable.propTypes = {
  dataAttendance: PropTypes.shape({
    dataList: PropTypes.array,
    total: PropTypes.number,
  }).isRequired,
  onEditDialog: PropTypes.func.isRequired,
  pagination: PropTypes.object.isRequired,
  onPaginationChange: PropTypes.func.isRequired,
};

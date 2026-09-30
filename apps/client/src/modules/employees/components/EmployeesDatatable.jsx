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

/** COP currency formatter for the salary column. */
const COP_CURRENCY_FORMAT = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
});

/** Cell renderer for salaries formatted as COP currency. */
const buildSalaryCell = (info) => {
  const salary = info.getValue();
  return salary ? COP_CURRENCY_FORMAT.format(salary) : null;
};

/** Cell renderer for user-name columns (uppercase, empty when absent). */
const buildRowNameCell = (rowKey) => (info) => {
  const name = info.row.original[rowKey]; // Accede al dato original de la fila
  return name ? name.toUpperCase() : null; // null mantiene la celda vacía
};

/** Column definitions for the employees table. */
const buildEmployeesColumns = (t) => [
  {
    accessorKey: 'name',
    header: t('name'),
    cell: buildUppercaseCell,
  },
  {
    accessorKey: 'lastName',
    header: t('last_name'),
    cell: buildUppercaseCell,
  },
  {
    accessorKey: 'dni',
    header: t('dni'),
    cell: buildUppercaseCell,
  },
  {
    accessorKey: 'email',
    header: t('email'),
    cell: buildUppercaseCell,
  },
  {
    accessorKey: 'position',
    header: t('position'),
    cell: buildUppercaseCell,
  },
  {
    accessorKey: 'department',
    header: t('department'),
    cell: buildUppercaseCell,
  },
  {
    accessorKey: 'salary',
    header: t('salary'),
    cell: buildSalaryCell,
  },
  {
    accessorKey: 'userEmployeeCreatedName',
    header: t('created_by'),
    cell: buildRowNameCell('userEmployeeCreatedName'),
  },
  {
    accessorKey: 'createdOn',
    header: t('created_on'),
    cell: buildFormattedDateCell,
  },
  {
    accessorKey: 'userEmployeeUpdatedName',
    header: t('created_by'),
    cell: buildRowNameCell('userEmployeeUpdatedName'),
  },
  {
    accessorKey: 'updatedOn',
    header: t('updated_on'),
    cell: buildFormattedDateCell,
  },
];

export const EmployeesDatatable = ({
  dataEmployees,
  onEditDialog,
  pagination,
  onPaginationChange,
}) => {
  const { t } = useTranslation();
  const { dataList, total } = dataEmployees;

  return (
    <DataTable
      columns={buildEmployeesColumns(t)}
      data={dataList}
      totalRows={total}
      handleRow={onEditDialog}
      pagination={pagination}
      onPaginationChange={onPaginationChange}
    />
  );
};

EmployeesDatatable.propTypes = {
  dataEmployees: PropTypes.shape({
    dataList: PropTypes.array,
    total: PropTypes.number,
  }).isRequired,
  onEditDialog: PropTypes.func.isRequired,
  pagination: PropTypes.object.isRequired,
  onPaginationChange: PropTypes.func.isRequired,
};

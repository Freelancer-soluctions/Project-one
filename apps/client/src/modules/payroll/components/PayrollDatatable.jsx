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

/** Cell renderer for user-name columns (uppercase, empty when absent). */
const buildRowNameCell = (rowKey) => (info) => {
  const name = info.row.original[rowKey]; // Accede al dato original de la fila
  return name ? name.toUpperCase() : null; // null mantiene la celda vacía
};

/** Column definitions for the payroll table. */
const buildPayrollColumns = (t) => [
  {
    accessorKey: 'employeeName',
    header: t('employee'),
    cell: buildUppercaseCell,
  },
  {
    accessorKey: 'month',
    header: t('month'),
    cell: (info) => info.getValue(),
  },
  {
    accessorKey: 'year',
    header: t('year'),
    cell: (info) => info.getValue(),
  },
  {
    accessorKey: 'baseSalary',
    header: t('base_salary'),
    cell: (info) => info.getValue(),
  },
  {
    accessorKey: 'extraHours',
    header: t('extra_hours'),
    cell: (info) => info.getValue(),
  },
  {
    accessorKey: 'deductions',
    header: t('deductions'),
    cell: (info) => info.getValue(),
  },
  {
    accessorKey: 'totalPayment',
    header: t('total_payment'),
    cell: (info) => info.getValue(),
  },
  {
    accessorKey: 'userPayrollCreatedName',
    header: t('created_by'),
    cell: buildRowNameCell('userPayrollCreatedName'),
  },
  {
    accessorKey: 'createdOn',
    header: t('created_on'),
    cell: buildFormattedDateCell,
  },
  {
    accessorKey: 'userPayrollUpdatedName',
    header: t('created_by'),
    cell: buildRowNameCell('userPayrollUpdatedName'),
  },
  {
    accessorKey: 'updatedOn',
    header: t('updated_on'),
    cell: buildFormattedDateCell,
  },
];

export const PayrollDatatable = ({
  dataPayroll,
  onEditDialog,
  pagination,
  onPaginationChange,
}) => {
  const { t } = useTranslation();
  const { dataList, total } = dataPayroll.data;

  return (
    <DataTable
      columns={buildPayrollColumns(t)}
      data={dataList}
      totalRows={total}
      handleRow={onEditDialog}
      pagination={pagination}
      onPaginationChange={onPaginationChange}
    />
  );
};

PayrollDatatable.propTypes = {
  dataPayroll: PropTypes.object.isRequired,
  onEditDialog: PropTypes.func.isRequired,
  pagination: PropTypes.object.isRequired,
  onPaginationChange: PropTypes.func.isRequired,
};

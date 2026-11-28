import { useTranslation } from 'react-i18next';
import { DataTable } from '@/components/dataTable';
import { format } from 'date-fns';
import PropTypes from 'prop-types';
import { Badge } from '@/components/ui/badge'; // Import Badge for status

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

/** Badge variant per vacation status. */
const STATUS_VARIANTS = {
  PENDING: 'warning',
  APPROVED: 'success',
  REJECTED: 'destructive',
  CANCELLED: 'secondary',
};

const getStatusVariant = (status) => STATUS_VARIANTS[status] ?? 'secondary';

/** Status badge cell component. */
function StatusBadgeCell({ status }) {
  const { t } = useTranslation();
  return (
    <Badge variant={getStatusVariant(status)}>
      {t(`status_${status}`)} {/* Assuming status translations */}
    </Badge>
  );
}

StatusBadgeCell.propTypes = {
  status: PropTypes.string,
};

/** Cell renderer for the employee object column. */
const buildEmployeeCell = (info) => {
  const employee = info.getValue();
  return employee ? `${employee.name} ${employee.lastName}` : '';
};

/** Cell renderer for the approver/rejecter name columns (empty when absent). */
const buildPlainNameCell = (rowKey) => (info) =>
  info.row.original[rowKey] ?? null;

/** Cell renderer for boolean "paid" (task 5.3a). */
const buildPaidCell = (t) => (info) => (info.getValue() ? t('yes') : t('no'));

/** Column definitions for the vacations table. */
const buildVacationColumns = (t) => [
  {
    accessorKey: 'employee',
    header: t('employee'),
    cell: buildEmployeeCell,
  },
  {
    accessorKey: 'startDate',
    header: t('start_date'),
    cell: (info) => format(new Date(info.getValue()), 'PPP'),
  },
  {
    accessorKey: 'endDate',
    header: t('end_date'),
    cell: (info) => format(new Date(info.getValue()), 'PPP'),
  },
  {
    accessorKey: 'status',
    header: t('status'),
    cell: (info) => <StatusBadgeCell status={info.getValue()} />,
  },
  {
    accessorKey: 'reason',
    header: t('reason'),
  },
  {
    accessorKey: 'comments',
    header: t('comments'),
  },
  {
    accessorKey: 'paid',
    header: t('paid'),
    cell: buildPaidCell(t),
  },
  {
    accessorKey: 'userVacationCreatedName',
    header: t('created_by'),
    cell: buildRowNameCell('userVacationCreatedName'),
  },
  {
    accessorKey: 'createdOn',
    header: t('created_on'),
    cell: buildFormattedDateCell,
  },
  {
    accessorKey: 'userVacationApprovedName',
    header: t('approved_by'),
    cell: buildPlainNameCell('userVacationApprovedName'),
  },
  {
    accessorKey: 'approvedAt',
    header: t('approved_on'),
    cell: buildFormattedDateCell,
  },
  {
    accessorKey: 'userVacationRejectedName',
    header: t('rejected_by'),
    cell: buildPlainNameCell('userVacationRejectedName'),
  },
  {
    accessorKey: 'rejectedAt',
    header: t('rejected_on'),
    cell: buildFormattedDateCell,
  },
  {
    accessorKey: 'userVacationUpdatedName',
    header: t('updated_by'),
    cell: buildRowNameCell('userVacationUpdatedName'),
  },
  {
    accessorKey: 'updatedOn',
    header: t('updated_on'),
    cell: buildFormattedDateCell,
  },
];

export const VacationDatatable = ({
  dataVacations,
  onEditDialog,
  pagination,
  onPaginationChange,
}) => {
  const { t } = useTranslation();
  const { dataList, total } = dataVacations.data;

  return (
    <DataTable
      columns={buildVacationColumns(t)}
      data={dataList}
      totalRows={total}
      handleRow={onEditDialog}
      pagination={pagination}
      onPaginationChange={onPaginationChange}
    />
  );
};

VacationDatatable.propTypes = {
  dataVacations: PropTypes.object.isRequired,
  onEditDialog: PropTypes.func.isRequired,
  pagination: PropTypes.object.isRequired,
  onPaginationChange: PropTypes.func.isRequired,
};

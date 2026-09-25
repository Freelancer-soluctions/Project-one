import { useTranslation } from 'react-i18next';
import { DataTable } from '@/components/dataTable';
import { format } from 'date-fns';
import PropTypes from 'prop-types';
import { Badge } from '@/components/ui/badge'; // Import Badge for status

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

/** Badge variant per permission status. */
const STATUS_VARIANTS = {
  PENDING: 'warning',
  APPROVED: 'success',
  REJECTED: 'destructive',
};

const getStatusVariant = (status) => STATUS_VARIANTS[status] ?? 'secondary';

/** Cell renderer for translated permission types. */
const buildTypeCell = (t) => (info) => {
  const type = info.getValue();
  return type ? t(`permission_type.${type}`) : ''; // Assuming translations
};

/** Status badge cell component. */
function StatusBadgeCell({ status }) {
  const { t } = useTranslation();
  return (
    <Badge variant={getStatusVariant(status)}>
      {t(`status.${status}`)} {/* Assuming status translations */}
    </Badge>
  );
}

StatusBadgeCell.propTypes = {
  status: PropTypes.string,
};

/** Column definitions for the permissions table. */
const buildPermissionColumns = (t) => [
  {
    accessorKey: 'employeeName',
    header: t('employee'),
    cell: buildUppercaseCell,
  },
  {
    accessorKey: 'type',
    header: t('type'),
    cell: buildTypeCell(t),
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
    accessorKey: 'reason',
    header: t('reason'),
    // Optional: Truncate long reasons
    cell: (info) => {
      const reason = info.getValue();
      return reason || '';
    },
  },
  {
    accessorKey: 'status',
    header: t('status'),
    cell: (info) => <StatusBadgeCell status={info.getValue()} />,
  },
  {
    accessorKey: 'userPermissionCreatedName',
    header: t('created_by'),
    // Clave heredada del módulo performance (comportamiento original)
    cell: buildRowNameCell('userPerformanceCreatedName'),
  },
  {
    accessorKey: 'createdOn',
    header: t('created_on'),
    cell: buildFormattedDateCell,
  },
  {
    accessorKey: 'userPermissionUpdatedName',
    header: t('created_by'),
    // Clave heredada del módulo performance (comportamiento original)
    cell: buildRowNameCell('userPerformanceUpdatedName'),
  },
  {
    accessorKey: 'updatedOn',
    header: t('updated_on'),
    cell: buildFormattedDateCell,
  },
];

export const PermissionDatatable = ({
  dataPermissions,
  onEditDialog,
  pagination,
  onPaginationChange,
}) => {
  const { t } = useTranslation();
  const { dataList, total } = dataPermissions.data;

  return (
    <DataTable
      columns={buildPermissionColumns(t)}
      data={dataList}
      totalRows={total}
      handleRow={onEditDialog}
      pagination={pagination}
      onPaginationChange={onPaginationChange}
    />
  );
};

PermissionDatatable.propTypes = {
  dataPermissions: PropTypes.array.isRequired,
  onEditDialog: PropTypes.func.isRequired,
  pagination: PropTypes.object.isRequired,
  onPaginationChange: PropTypes.func.isRequired,
};

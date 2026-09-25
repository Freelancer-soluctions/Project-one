import { DataTable } from '@/components/dataTable/index';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import PropTypes from 'prop-types';

/** Cell renderer for date columns. */
const buildDateCell = (dateFormat) => (info) =>
  info.getValue() ? format(info.getValue(), dateFormat) : '';

/** Cell renderer that truncates long text with an ellipsis. */
const buildTruncatedTextCell = (maxLength) => (info) => {
  const value = info.getValue();
  return value.length > maxLength ? `${value.slice(0, maxLength)}...` : value;
};

/** Cell renderer for user-name columns (uppercase, empty when absent). */
const buildUserNameCell = (rowKey) => (info) => {
  const user = info.row.original[rowKey]; // Accede al dato original de la fila
  return user?.name ? user.name.toUpperCase() : null; // null mantiene la celda vacía
};

/** Column definitions for the news table. */
const buildNewsColumns = (t) => [
  {
    accessorKey: 'createdOn',
    header: t('created_on'),
    cell: buildDateCell('dd/MM/yyyy'),
  },
  {
    accessorKey: 'description',
    header: t('description'),
    cell: buildTruncatedTextCell(30),
  },
  {
    accessorKey: 'status.description',
    header: t('status'),
  },
  {
    accessorKey: 'userNewsCreated.name',
    header: t('created_by'),
    cell: buildUserNameCell('userNewsCreated'),
  },
  {
    accessorKey: 'userNewsPending.name',
    header: t('pending_by'),
    cell: buildUserNameCell('userNewsPending'),
  },
  {
    accessorKey: 'pendingOn',
    header: t('pending_on'),
    cell: buildDateCell('dd/MM/yyyy/hh:mm:s aaa'),
  },
  {
    accessorKey: 'userNewsClosed.name',
    header: t('closed_by'),
    cell: buildUserNameCell('userNewsClosed'),
  },
  {
    accessorKey: 'closedOn',
    header: t('closed_on'),
    cell: buildDateCell('dd/MM/yyyy/hh:mm:s aaa'),
  },
];

export const NewsDatatable = ({
  dataNews,
  setSelectedRow,
  setOpenDialog,
  setActionDialog,
  pagination,
  onPaginationChange,
}) => {
  const { t } = useTranslation();
  const { dataList, total } = dataNews.data;

  const handleEditDialog = (row) => {
    setActionDialog(t('edit_new'));
    setSelectedRow(row);
    setOpenDialog(true);
  };

  return (
    <DataTable
      columns={buildNewsColumns(t)}
      data={dataList}
      totalRows={total}
      handleRow={handleEditDialog}
      pagination={pagination}
      onPaginationChange={onPaginationChange}
    />
  );
};

NewsDatatable.propTypes = {
  dataNews: PropTypes.object,
  setSelectedRow: PropTypes.func,
  setOpenDialog: PropTypes.func,
  setActionDialog: PropTypes.func,
  pagination: PropTypes.object.isRequired,
  onPaginationChange: PropTypes.func.isRequired,
};

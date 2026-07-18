import { DataTable } from '@/components/dataTable/index';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import PropTypes from 'prop-types';

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

  const columnDefNews = [
    {
      accessorKey: 'createdOn',
      header: t('created_on'),
      cell: (info) =>
        info.getValue() ? format(info.getValue(), 'dd/MM/yyyy') : '',
    },
    {
      accessorKey: 'description',
      header: t('description'),
      cell: (info) => {
        const value = info.getValue();
        return value.length > 30 ? `${value.slice(0, 30)}...` : value;
      },
    },
    {
      accessorKey: 'status.description',
      header: t('status'),
    },
    {
      accessorKey: 'userNewsCreated.name',
      header: t('created_by'),
      cell: (info) => {
        const userNewsCreated = info.row.original.userNewsCreated; // Accede al dato original de la fila
        return userNewsCreated?.name
          ? userNewsCreated.name.toUpperCase()
          : null; // Retorna null para mantener la celda vacía
      },
    },
    {
      accessorKey: 'userNewsPending.name',
      header: t('pending_by'),
      cell: (info) => {
        const userNewsPending = info.row.original.userNewsPending; // Accede al dato original de la fila
        return userNewsPending?.name
          ? userNewsPending.name.toUpperCase()
          : null; // Retorna null para mantener la celda vacía
      },
    },
    {
      accessorKey: 'pendingOn',
      header: t('pending_on'),
      cell: (info) =>
        info.getValue()
          ? format(info.getValue(), 'dd/MM/yyyy/hh:mm:s aaa')
          : '',
    },
    {
      accessorKey: 'userNewsClosed.name',
      header: t('closed_by'),
      cell: (info) => {
        const userNewsClosed = info.row.original.userNewsClosed; // Accede al dato original de la fila
        return userNewsClosed?.name ? userNewsClosed.name.toUpperCase() : null; // Retorna null para mantener la celda vacía
      },
    },
    {
      accessorKey: 'closedOn',
      header: t('closed_on'),
      cell: (info) =>
        info.getValue()
          ? format(info.getValue(), 'dd/MM/yyyy/hh:mm:s aaa')
          : '',
    },
  ];

  const handleEditDialog = (row) => {
    setActionDialog(t('edit_new'));
    setSelectedRow(row);
    setOpenDialog(true);
  };

  return (
    <>
      <DataTable
        columns={columnDefNews}
        data={dataList}
        totalRows={total}
        handleRow={(row) => handleEditDialog(row)}
        pagination={pagination}
        onPaginationChange={onPaginationChange}
      />
    </>
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

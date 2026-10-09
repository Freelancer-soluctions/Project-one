import { useTranslation } from 'react-i18next';
import { DataTable } from '@/components/dataTable';
import { format } from 'date-fns';
import PropTypes from 'prop-types';

export const ProviderOrdersDatatable = ({
  dataProviderOrders,
  onEditDialog,
  totalRows = dataProviderOrders?.data?.length || 0,
  pagination = { pageIndex: 0, pageSize: 20 },
  onPaginationChange = () => {},
}) => {
  const { t } = useTranslation();

  const columnDefProviderOrders = [
    {
      accessorKey: 'supplierId',
      header: t('supplierId'),
      cell: (info) => info.getValue(),
    },
    {
      accessorKey: 'notes',
      header: t('notes'),
      cell: (info) => info.getValue()?.toUpperCase(),
    },
    {
      accessorKey: 'createdOn',
      header: t('created_on'),
      cell: (info) => format(new Date(info.getValue()), 'PPP'),
    },
    {
      accessorKey: 'updatedOn',
      header: t('updated_on'),
      cell: (info) => {
        const date = info.getValue();
        return date ? format(new Date(date), 'PPP') : null;
      },
    },
  ];

  const handleEditDialog = (row) => {
    onEditDialog(row);
  };

  return (
    <DataTable
      columns={columnDefProviderOrders}
      data={dataProviderOrders.data}
      totalRows={totalRows}
      handleRow={(row) => handleEditDialog(row)}
      pagination={pagination}
      onPaginationChange={onPaginationChange}
    />
  );
};

ProviderOrdersDatatable.propTypes = {
  dataProviderOrders: PropTypes.object.isRequired,
  onEditDialog: PropTypes.func.isRequired,
  totalRows: PropTypes.number,
  pagination: PropTypes.object,
  onPaginationChange: PropTypes.func,
};

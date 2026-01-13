import { useTranslation } from 'react-i18next';
import { DataTable } from '@/components/dataTable/index';
import { format } from 'date-fns';
import PropTypes from 'prop-types';

export const InventoryMovementDatatable = ({
  dataInventoryMovements,
  onEditDialog,
  pagination,
  onPaginationChange,
}) => {
  const { t } = useTranslation();
  const { dataList, total } = dataInventoryMovements.data;

  const columnDefInventoryMovements = [
    {
      accessorKey: 'product.name',
      header: t('product'),
    },
    {
      accessorKey: 'warehouse.name',
      header: t('warehouse'),
    },
    {
      accessorKey: 'quantity',
      header: t('quantity'),
    },
    {
      accessorKey: 'type',
      header: t('type'),
    },
    {
      accessorKey: 'reason',
      header: t('reason'),
    },
    {
      accessorKey: 'createdOn',
      header: t('created_on'),
      cell: ({ row }) => format(new Date(row.original.createdOn), 'PPP'),
    },
    {
      accessorKey: 'updatedOn',
      header: t('updated_on'),
      cell: ({ row }) =>
        row.original.updatedOn
          ? format(new Date(row.original.updatedOn), 'PPP')
          : '',
    },
  ];

  const handleEditDialog = (row) => {
    onEditDialog(row.original);
  };

  return (
    <DataTable
      columns={columnDefInventoryMovements}
      data={dataList}
      totalRows={total}
      handleRow={(row) => handleEditDialog(row)}
      pagination={pagination}
      onPaginationChange={onPaginationChange}
    />
  );
};

InventoryMovementDatatable.propTypes = {
  dataInventoryMovements: PropTypes.object.isRequired,
  onEditDialog: PropTypes.func.isRequired,
  pagination: PropTypes.object.isRequired,
  onPaginationChange: PropTypes.func.isRequired,
};

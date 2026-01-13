import { useTranslation } from 'react-i18next';
import { DataTable } from '@/components/dataTable';
import { format } from 'date-fns';
import PropTypes from 'prop-types';

export const ClientOrderDatatable = ({ dataClientOrder, onEditDialog }) => {
  const { t } = useTranslation();
  const { dataList, total } = dataClientOrder.data;
  const columnDefClientOrder = [
    {
      accessorKey: 'clientId',
      header: t('clientId'),
      cell: (info) => info.getValue(),
    },
    {
      accessorKey: 'status',
      header: t('status'),
      cell: (info) => info.getValue()?.toUpperCase(),
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
    {
      accessorKey: 'saleId',
      header: t('saleId'),
      cell: (info) => info.getValue(),
    },
  ];

  const handleEditDialog = (row) => {
    onEditDialog(row);
  };

  return (
    <DataTable
      columns={columnDefClientOrder}
      data={dataList}
      totalRows={total}
      handleRow={(row) => handleEditDialog(row)}
      pagination={pagination}
      onPaginationChange={onPaginationChange}
    />
  );
};

ClientOrderDatatable.propTypes = {
  dataClientOrder: PropTypes.object.isRequired,
  onEditDialog: PropTypes.func.isRequired,
  pagination: PropTypes.object.isRequired,
  onPaginationChange: PropTypes.func.isRequired,
};

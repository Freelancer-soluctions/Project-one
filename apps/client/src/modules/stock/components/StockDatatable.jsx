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

/** Cell renderer for COP currency values. */
const buildCopCurrencyCell = (info) =>
  info
    .getValue()
    ?.toLocaleString('es-CO', { style: 'currency', currency: 'COP' });

/** Column definitions for the stock table. */
const buildStockColumns = (t) => [
  {
    accessorKey: 'createdOn',
    header: t('created_on'),
    cell: (info) => format(new Date(info.getValue()), 'PPP'),
  },
  {
    accessorKey: 'productName',
    header: t('product'),
    cell: buildUppercaseCell,
  },
  {
    accessorKey: 'productPrice',
    header: t('price'),
    cell: buildCopCurrencyCell,
  },
  {
    accessorKey: 'quantity',
    header: t('quantity'),
  },
  {
    accessorKey: 'totalCost',
    header: t('total_cost'),
    cell: buildCopCurrencyCell,
  },
  {
    accessorKey: 'warehouseName',
    header: t('warehouse'),
    cell: buildUppercaseCell,
  },
  {
    accessorKey: 'unitMeasure',
    header: t('unitMeasure'),
    cell: buildUppercaseCell,
  },
  {
    accessorKey: 'lot',
    header: t('lot'),
    cell: buildUppercaseCell,
  },
  {
    accessorKey: 'expirationDate',
    header: t('expiration_date'),
    cell: buildFormattedDateCell,
  },
  {
    accessorKey: 'expirationStatus',
    header: t('expiration_status'),
    cell: buildUppercaseCell,
  },
  {
    accessorKey: 'userStockCreatedName',
    header: t('created_by'),
    cell: buildUppercaseCell,
  },
  {
    accessorKey: 'userStockUpdatedName',
    header: t('updated_by'),
    cell: buildUppercaseCell,
  },
  {
    accessorKey: 'updatedOn',
    header: t('updated_on'),
    cell: buildFormattedDateCell,
  },
];

export const StockDatatable = ({
  dataStock,
  onEditDialog,
  pagination,
  onPaginationChange,
}) => {
  const { t } = useTranslation();
  const { dataList, total } = dataStock.data;

  return (
    <DataTable
      columns={buildStockColumns(t)}
      data={dataList}
      totalRows={total}
      handleRow={onEditDialog}
      pagination={pagination}
      onPaginationChange={onPaginationChange}
    />
  );
};

StockDatatable.propTypes = {
  dataStock: PropTypes.object.isRequired,
  onEditDialog: PropTypes.func.isRequired,
  pagination: PropTypes.object.isRequired,
  onPaginationChange: PropTypes.func.isRequired,
};

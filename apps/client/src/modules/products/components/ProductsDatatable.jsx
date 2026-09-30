import { DataTable } from '@/components/dataTable/index';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import PropTypes from 'prop-types';

/** Cell renderer for short dates (empty when absent). */
const buildFormattedShortDateCell = (info) =>
  info.getValue() ? format(info.getValue(), 'dd/MM/yyyy') : '';

/** Cell renderer for text truncated to 30 chars. */
const buildTruncatedCell = (info) => {
  const value = info.getValue();
  return value.length > 30 ? `${value.slice(0, 30)}...` : value;
};

/** Cell renderer for user-name columns (uppercase, empty when absent). */
const buildRowNameCell = (rowKey) => (info) => {
  const name = info.row.original[rowKey]; // Accede al dato original de la fila
  return name ? name.toUpperCase() : null; // Retorna null para mantener la celda vacía
};

/** Cell renderer for timestamps (empty when absent). */
const buildFormattedTimestampCell = (info) =>
  info.getValue() ? format(info.getValue(), 'dd/MM/yyyy/hh:mm:s aaa') : '';

/** Column definitions for the products table. */
const buildProductsColumns = (t) => [
  {
    accessorKey: 'createdOn',
    header: t('created_on'),
    cell: buildFormattedShortDateCell,
  },
  {
    accessorKey: 'sku',
    header: t('sku'),
  },
  {
    accessorKey: 'name',
    header: t('name'),
    cell: buildTruncatedCell,
  },
  {
    accessorKey: 'categoryDescription',
    header: t('category'),
  },
  {
    accessorKey: 'providerDescription',
    header: t('provider'),
  },
  {
    accessorKey: 'price',
    header: t('price'),
  },
  {
    accessorKey: 'cost',
    header: t('cost'),
  },
  {
    accessorKey: 'userProductCreatedName',
    header: t('created_by'),
    cell: buildRowNameCell('userProductCreatedName'),
  },
  {
    accessorKey: 'userProductUpdatedName',
    header: t('updated_by'),
    cell: buildRowNameCell('userProductUpdatedName'),
  },
  {
    accessorKey: 'updatedOn',
    header: t('updated_on'),
    cell: buildFormattedTimestampCell,
  },
];

export const ProductsDatatable = ({
  dataProducts,
  onOpenProductsForms,
  pagination,
  onPaginationChange,
}) => {
  const { t } = useTranslation();
  const { dataList, total } = dataProducts;

  return (
    <DataTable
      columns={buildProductsColumns(t)}
      data={dataList}
      totalRows={total}
      handleRow={onOpenProductsForms}
      pagination={pagination}
      onPaginationChange={onPaginationChange}
    />
  );
};

ProductsDatatable.propTypes = {
  dataProducts: PropTypes.shape({
    dataList: PropTypes.array,
    total: PropTypes.number,
  }),
  onOpenProductsForms: PropTypes.func.isRequired,
  pagination: PropTypes.object.isRequired,
  onPaginationChange: PropTypes.func.isRequired,
};

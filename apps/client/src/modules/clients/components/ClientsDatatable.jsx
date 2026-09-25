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

/** Column definitions for the clients table. */
const buildClientsColumns = (t) => [
  {
    accessorKey: 'name',
    header: t('name'),
    cell: buildUppercaseCell,
  },
  {
    accessorKey: 'email',
    header: t('email'),
    cell: buildUppercaseCell,
  },
  {
    accessorKey: 'phone',
    header: t('phone'),
    cell: buildUppercaseCell,
  },
  {
    accessorKey: 'address',
    header: t('address'),
    cell: buildUppercaseCell,
  },
  {
    accessorKey: 'createdOn',
    header: t('created_on'),
    cell: (info) => format(new Date(info.getValue()), 'PPP'),
  },
  {
    accessorKey: 'updatedOn',
    header: t('updated_on'),
    cell: buildFormattedDateCell,
  },
];

export const ClientsDatatable = ({
  dataClients,
  pagination,
  onPaginationChange,
  onEditDialog,
}) => {
  const { t } = useTranslation();
  const { dataList, total } = dataClients;

  return (
    <DataTable
      columns={buildClientsColumns(t)}
      data={dataList}
      totalRows={total}
      handleRow={onEditDialog}
      pagination={pagination}
      onPaginationChange={onPaginationChange}
    />
  );
};

ClientsDatatable.propTypes = {
  dataClients: PropTypes.shape({
    dataList: PropTypes.array,
    total: PropTypes.number,
  }).isRequired,
  onEditDialog: PropTypes.func.isRequired,
  pagination: PropTypes.object.isRequired,
  onPaginationChange: PropTypes.func.isRequired,
};

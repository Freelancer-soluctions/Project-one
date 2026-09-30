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

/** Cell renderer for uppercase text truncated to 30 chars. */
const buildTruncatedUppercaseCell = (info) => {
  const value = info.getValue();
  if (!value) return '';

  const upper = value.toUpperCase();
  return upper.length > 30 ? `${upper.slice(0, 30)}...` : upper;
};

/** Column definitions for the users table. */
const buildUsersColumns = (t) => [
  {
    accessorKey: 'startDate',
    header: t('start_date'),
    cell: (info) => format(new Date(info.getValue()), 'PPP'),
  },
  {
    accessorKey: 'name',
    header: t('name'),
    cell: buildTruncatedUppercaseCell,
  },
  {
    accessorKey: 'statusDescription',
    header: t('status'),
    cell: buildUppercaseCell,
  },
  {
    accessorKey: 'roleDescription',
    header: t('rol'),
    cell: buildUppercaseCell,
  },
  {
    accessorKey: 'email',
    header: t('email'),
    cell: buildTruncatedUppercaseCell,
  },
  {
    accessorKey: 'telephone',
    header: t('telephone'),
    cell: (info) => info.getValue(),
  },
  {
    accessorKey: 'state',
    header: t('state'),
    cell: buildTruncatedUppercaseCell,
  },
  {
    accessorKey: 'address',
    header: t('address'),
    cell: buildTruncatedUppercaseCell,
  },
  {
    accessorKey: 'birthday',
    header: t('birthday'),
    cell: (info) => format(new Date(info.getValue()), 'PPP'),
  },
  {
    accessorKey: 'lastUpdatedByName',
    header: t('updated_by'),
    cell: buildTruncatedUppercaseCell,
  },
  {
    accessorKey: 'lastUpdatedOn',
    header: t('updated_on'),
    cell: buildFormattedDateCell,
  },
];

export const UsersDatatable = ({
  dataUsers,
  onOpenUsersForms,
  pagination,
  onPaginationChange,
}) => {
  const { t } = useTranslation();
  const { dataList, total } = dataUsers.data;

  return (
    <DataTable
      columns={buildUsersColumns(t)}
      data={dataList}
      totalRows={total}
      handleRow={onOpenUsersForms}
      pagination={pagination}
      onPaginationChange={onPaginationChange}
    />
  );
};

UsersDatatable.propTypes = {
  dataUsers: PropTypes.object.isRequired,
  onOpenUsersForms: PropTypes.func.isRequired,
  pagination: PropTypes.object.isRequired,
  onPaginationChange: PropTypes.func.isRequired,
};

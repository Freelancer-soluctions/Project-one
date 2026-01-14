import { useTranslation } from 'react-i18next';
import { DataTable } from '@/components/dataTable';
import { format } from 'date-fns';
import PropTypes from 'prop-types';

export const UsersDatatable = ({
  dataUsers,
  onOpenUsersForms,
  pagination,
  onPaginationChange,
}) => {
  const { t } = useTranslation();
  const { dataList, total } = dataUsers.data;

  const columnDefUsers = [
    {
      accessorKey: 'startDate',
      header: t('start_date'),
      cell: (info) => format(new Date(info.getValue()), 'PPP'),
    },
    {
      accessorKey: 'name',
      header: t('name'),
      // cell: (info) => {
      //   const value = info.getValue()?.toUpperCase();
      //   return value.length > 30 ? `${value.slice(0, 30)}...` : value;
      // },
      cell: (info) => {
        const value = info.getValue();
        if (!value) return '';

        const upper = value.toUpperCase();
        return upper.length > 30 ? `${upper.slice(0, 30)}...` : upper;
      },
    },
    {
      accessorKey: 'statusDescription',
      header: t('status'),
      cell: (info) => info.getValue()?.toUpperCase(),
    },
    {
      accessorKey: 'roleDescription',
      header: t('rol'),
      cell: (info) => info.getValue()?.toUpperCase(),
    },
    {
      accessorKey: 'email',
      header: t('email'),
      cell: (info) => {
        const value = info.getValue();
        if (!value) return '';

        const upper = value.toUpperCase();
        return upper.length > 30 ? `${upper.slice(0, 30)}...` : upper;
      },
    },
    {
      accessorKey: 'telephone',
      header: t('telephone'),
      cell: (info) => info.getValue(),
    },
    {
      accessorKey: 'state',
      header: t('state'),
      cell: (info) => {
        const value = info.getValue();
        if (!value) return '';

        const upper = value.toUpperCase();
        return upper.length > 30 ? `${upper.slice(0, 30)}...` : upper;
      },
    },
    {
      accessorKey: 'address',
      header: t('address'),
      cell: (info) => {
        const value = info.getValue();
        if (!value) return '';

        const upper = value.toUpperCase();
        return upper.length > 30 ? `${upper.slice(0, 30)}...` : upper;
      },
    },
    {
      accessorKey: 'birthday',
      header: t('birthday'),
      cell: (info) => format(new Date(info.getValue()), 'PPP'),
    },

    {
      accessorKey: 'lastUpdatedByName',
      header: t('updated_by'),
      cell: (info) => {
        const value = info.getValue();
        if (!value) return '';

        const upper = value.toUpperCase();
        return upper.length > 30 ? `${upper.slice(0, 30)}...` : upper;
      },
    },
    {
      accessorKey: 'lastUpdatedOn',
      header: t('updated_on'),
      cell: (info) => {
        const date = info.getValue();
        return date ? format(new Date(date), 'PPP') : null;
      },
    },
  ];

  const handleEditDialog = (row) => {
    onOpenUsersForms(row);
  };

  return (
    <DataTable
      columns={columnDefUsers}
      data={dataList}
      totalRows={total}
      handleRow={(row) => handleEditDialog(row)}
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

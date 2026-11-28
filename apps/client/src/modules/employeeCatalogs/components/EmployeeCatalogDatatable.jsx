import { useTranslation } from 'react-i18next';
import { DataTable } from '@/components/dataTable';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import PropTypes from 'prop-types';

export const EmployeeCatalogDatatable = ({
  dataList,
  total,
  onEdit,
  pagination,
  onPaginationChange,
}) => {
  const { t } = useTranslation();

  const columns = [
    {
      accessorKey: 'code',
      header: t('code'),
      cell: (info) => info.getValue()?.toUpperCase(),
    },
    {
      accessorKey: 'name',
      header: t('name'),
    },
    {
      accessorKey: 'active',
      header: t('status'),
      cell: (info) => (
        <Badge variant={info.getValue() ? 'default' : 'secondary'}>
          {t(info.getValue() ? 'active' : 'inactive')}
        </Badge>
      ),
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

  return (
    <DataTable
      columns={columns}
      data={dataList}
      totalRows={total}
      handleRow={onEdit}
      pagination={pagination}
      onPaginationChange={onPaginationChange}
    />
  );
};

EmployeeCatalogDatatable.propTypes = {
  dataList: PropTypes.array.isRequired,
  total: PropTypes.number.isRequired,
  onEdit: PropTypes.func.isRequired,
  pagination: PropTypes.object.isRequired,
  onPaginationChange: PropTypes.func.isRequired,
};

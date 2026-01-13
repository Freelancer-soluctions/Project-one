import { useTranslation } from 'react-i18next';
import { DataTable } from '@/components/dataTable';
import { format } from 'date-fns';
import PropTypes from 'prop-types';
import { Badge } from '@/components/ui/badge'; // Import Badge for status

export const VacationDatatable = ({
  dataVacations,
  onEditDialog,
  pagination,
  onPaginationChange,
}) => {
  const { t } = useTranslation();
  const { dataList, total } = dataVacations.data;

  const getStatusVariant = (status) => {
    switch (status) {
      case 'PENDING':
        return 'warning';
      case 'APPROVED':
        return 'success';
      case 'REJECTED':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const columnDefVacations = [
    {
      accessorKey: 'employee',
      header: t('employee'),
      cell: (info) => {
        const employee = info.getValue();
        return employee ? `${employee.name} ${employee.lastName}` : '';
      },
    },
    {
      accessorKey: 'startDate',
      header: t('start_date'),
      cell: (info) => format(new Date(info.getValue()), 'PPP'),
    },
    {
      accessorKey: 'endDate',
      header: t('end_date'),
      cell: (info) => format(new Date(info.getValue()), 'PPP'),
    },
    {
      accessorKey: 'status',
      header: t('status'),
      cell: (info) => {
        const status = info.getValue();
        return (
          <Badge variant={getStatusVariant(status)}>
            {t(`status.${status}`)} {/* Assuming status translations */}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'userVacationCreatedName',
      header: t('created_by'),
      cell: (info) => {
        const userPerformanceCreatedName =
          info.row.original.userPerformanceCreatedName; // Accede al dato original de la fila
        return userPerformanceCreatedName
          ? userPerformanceCreatedName.toUpperCase()
          : null; // Retorna null para mantener la celda vacía
      },
    },
    {
      accessorKey: 'createdOn',
      header: t('created_on'),
      cell: (info) => format(new Date(info.getValue()), 'PPP'),
    },
    {
      accessorKey: 'userVacationUpdatedName',
      header: t('created_by'),
      cell: (info) => {
        const userPerformanceUpdatedName =
          info.row.original.userPerformanceUpdatedName; // Accede al dato original de la fila
        return userPerformanceUpdatedName
          ? userPerformanceUpdatedName.toUpperCase()
          : null; // Retorna null para mantener la celda vacía
      },
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
      columns={columnDefVacations}
      data={dataList}
      totalRows={total}
      handleRow={(row) => handleEditDialog(row)}
      pagination={pagination}
      onPaginationChange={onPaginationChange}
    />
  );
};

VacationDatatable.propTypes = {
  dataVacations: PropTypes.object.isRequired,
  onEditDialog: PropTypes.func.isRequired,
  pagination: PropTypes.object.isRequired,
  onPaginationChange: PropTypes.func.isRequired,
};

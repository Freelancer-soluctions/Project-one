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

/** Cell renderer for user-name columns (uppercase, empty when absent). */
const buildRowNameCell = (rowKey) => (info) => {
  const name = info.row.original[rowKey]; // Accede al dato original de la fila
  return name ? name.toUpperCase() : null; // null mantiene la celda vacía
};

/** Column definitions for the performance evaluations table. */
const buildEvaluationColumns = (t) => [
  {
    accessorKey: 'employeeName',
    header: t('employee'),
    cell: buildUppercaseCell,
  },
  {
    accessorKey: 'date',
    header: t('date'),
    cell: (info) => format(new Date(info.getValue()), 'PPP'),
  },
  {
    accessorKey: 'calification',
    header: t('calification'),
    cell: (info) => info.getValue(), // Display the number directly
  },
  {
    accessorKey: 'comments',
    header: t('comments'),
    // Optional: Truncate long comments if needed
    cell: (info) => {
      const comments = info.getValue();
      return comments || '';
    },
  },
  {
    accessorKey: 'userPerformanceCreatedName',
    header: t('created_by'),
    cell: buildRowNameCell('userPerformanceCreatedName'),
  },
  {
    accessorKey: 'createdOn',
    header: t('created_on'),
    cell: buildFormattedDateCell,
  },
  {
    accessorKey: 'userPerformanceUpdatedName',
    header: t('created_by'),
    cell: buildRowNameCell('userPerformanceUpdatedName'),
  },
  {
    accessorKey: 'updatedOn',
    header: t('updated_on'),
    cell: buildFormattedDateCell,
  },
];

export const PerformanceEvaluationDatatable = ({
  dataEvaluations,
  onEditDialog,
  pagination,
  onPaginationChange,
}) => {
  const { t } = useTranslation();

  const { dataList, total } = dataEvaluations.data;

  return (
    <DataTable
      columns={buildEvaluationColumns(t)}
      data={dataList}
      totalRows={total}
      handleRow={onEditDialog}
      pagination={pagination}
      onPaginationChange={onPaginationChange}
    />
  );
};

PerformanceEvaluationDatatable.propTypes = {
  dataEvaluations: PropTypes.object.isRequired,
  onEditDialog: PropTypes.func.isRequired,
  pagination: PropTypes.object.isRequired,
  onPaginationChange: PropTypes.func.isRequired,
};

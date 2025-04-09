import { useTranslation } from 'react-i18next'
import { DataTable } from '@/components/dataTable'
import { format } from 'date-fns'
import PropTypes from 'prop-types'

export const PerformanceEvaluationDatatable = ({
  dataEvaluations,
  onEditDialog,
}) => {
  const { t } = useTranslation()

  const columnDefEvaluations = [
    {
      accessorKey: 'employee',
      header: t('employee'),
      cell: info => {
        const employee = info.getValue()
        return employee ? `${employee.name} ${employee.lastName}` : ''
      }
    },
    {
      accessorKey: 'date',
      header: t('date'),
      cell: info => format(new Date(info.getValue()), 'PPP')
    },
    {
      accessorKey: 'calification',
      header: t('calification'),
      cell: info => info.getValue() // Display the number directly
    },
    {
      accessorKey: 'comments',
      header: t('comments'),
      // Optional: Truncate long comments if needed
      cell: info => {
        const comments = info.getValue();
        // return comments && comments.length > 50 ? `${comments.substring(0, 50)}...` : comments;
        return comments || ''
      }
    },
    {
      accessorKey: 'createdOn',
      header: t('created_on'),
      cell: info => format(new Date(info.getValue()), 'PPP')
    },
    {
      accessorKey: 'updatedOn',
      header: t('updated_on'),
      cell: info => {
        const date = info.getValue()
        return date ? format(new Date(date), 'PPP') : null
      }
    }
  ]

  const handleEditDialog = row => {
    onEditDialog(row)
  }

  const evaluationData = Array.isArray(dataEvaluations?.data) ? dataEvaluations.data : [];

  return (
    <DataTable
      columns={columnDefEvaluations}
      data={evaluationData}
      handleRow={row => handleEditDialog(row)}
    />
  )
}

PerformanceEvaluationDatatable.propTypes = {
  dataEvaluations: PropTypes.shape({
    data: PropTypes.array
  }),
  onEditDialog: PropTypes.func.isRequired
} 
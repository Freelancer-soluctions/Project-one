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
      accessorKey: 'employeeName',
      header: t('employee'),
      cell: info => info.getValue()?.toUpperCase()
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
        const comments = info.getValue()
        // return comments && comments.length > 50 ? `${comments.substring(0, 50)}...` : comments;
        return comments || ''
      }
    },
    {
      accessorKey: 'userPerformanceCreatedName',
      header: t('created_by'),
      cell: info => {
        const userPerformanceCreatedName =
          info.row.original.userPerformanceCreatedName // Accede al dato original de la fila
        return userPerformanceCreatedName
          ? userPerformanceCreatedName.toUpperCase()
          : null // Retorna null para mantener la celda vacía
      }
    },
    {
      accessorKey: 'createdOn',
      header: t('created_on'),
      cell: info => format(new Date(info.getValue()), 'PPP')
    },
    {
      accessorKey: 'userPerformanceUpdatedName',
      header: t('created_by'),
      cell: info => {
        const userPerformanceUpdatedName =
          info.row.original.userPerformanceUpdatedName // Accede al dato original de la fila
        return userPerformanceUpdatedName
          ? userPerformanceUpdatedName.toUpperCase()
          : null // Retorna null para mantener la celda vacía
      }
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

  return (
    <DataTable
      columns={columnDefEvaluations}
      data={dataEvaluations.data}
      handleRow={row => handleEditDialog(row)}
    />
  )
}

PerformanceEvaluationDatatable.propTypes = {
  dataEvaluations: PropTypes.object.isRequired,
  onEditDialog: PropTypes.func.isRequired
}

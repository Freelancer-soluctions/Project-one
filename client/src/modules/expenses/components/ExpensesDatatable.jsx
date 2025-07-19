import { useTranslation } from 'react-i18next'
import { DataTable } from '@/components/dataTable'
import { format } from 'date-fns'
import PropTypes from 'prop-types'

export const ExpensesDatatable = ({ dataExpenses, onEditDialog }) => {
  const { t } = useTranslation()

  const columnDefExpenses = [
    {
      accessorKey: 'description',
      header: t('description'),
      cell: info => info.getValue()?.toUpperCase()
    },
    {
      accessorKey: 'total',
      header: t('total'),
      cell: info => info.getValue()
    },
    {
      accessorKey: 'category',
      header: t('category'),
      cell: info => info.getValue()?.toUpperCase()
    },
    {
      accessorKey: 'userExpenseCreatedName',
      header: t('created_by'),
      cell: info => {
        const userExpenseCreated = info.row.original.userExpenseCreatedName // Accede al dato original de la fila
        return userExpenseCreated ? userExpenseCreated.toUpperCase() : null // Retorna null para mantener la celda vacía
      }
    },

    {
      accessorKey: 'createdOn',
      header: t('created_on'),
      cell: info => format(new Date(info.getValue()), 'PPP')
    },
    {
      accessorKey: 'userExpenseUpdatedName',
      header: t('updated_by'),
      cell: info => {
        const userExpenseUpdated = info.row.original.userExpenseUpdatedName // Accede al dato original de la fila
        return userExpenseUpdated ? userExpenseUpdated.toUpperCase() : null // Retorna null para mantener la celda vacía
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
      columns={columnDefExpenses}
      data={dataExpenses.data}
      handleRow={row => handleEditDialog(row)}
    />
  )
}

ExpensesDatatable.propTypes = {
  dataExpenses: PropTypes.object.isRequired,
  onEditDialog: PropTypes.func.isRequired
}

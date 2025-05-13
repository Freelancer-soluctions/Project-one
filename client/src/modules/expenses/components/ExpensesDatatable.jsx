import { useTranslation } from 'react-i18next'
import { DataTable } from '@/components/dataTable' // Assuming this path is correct
import { format } from 'date-fns'
import PropTypes from 'prop-types'

export const ExpensesDatatable = ({ // Renamed from ClientsDatatable
  dataExpenses, // Renamed from dataClients
  onEditDialog,
}) => {
  const { t } = useTranslation()

  const columnDefExpenses = [ // Renamed from columnDefClients
    {
      accessorKey: 'description', // Changed from 'name'
      header: t('description'), // Changed from t('name')
      cell: info => info.getValue()?.toUpperCase()
    },
    {
      accessorKey: 'total', // Changed from 'email'
      header: t('total'), // Changed from t('email')
      // Assuming total is a number, no toUpperCase() needed. Format if necessary.
      cell: info => info.getValue()
    },
    {
      accessorKey: 'category', // Changed from 'phone'
      header: t('category'), // Changed from t('phone')
      cell: info => info.getValue()?.toUpperCase()
    },
    {
      accessorKey: 'status', // Changed from 'address'
      header: t('status'), // Changed from t('address'), assuming 'status' is a string representation from the enum
      cell: info => info.getValue()?.toUpperCase() // Or handle enum display appropriately
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

  return (
    <DataTable
      columns={columnDefExpenses} // Renamed from columnDefClients
      data={dataExpenses.data} // Renamed from dataClients.data
      handleRow={row => handleEditDialog(row)}
    />
  )
}

ExpensesDatatable.propTypes = { // Renamed from ClientsDatatable
  dataExpenses: PropTypes.object.isRequired, // Renamed from dataClients
  onEditDialog: PropTypes.func.isRequired
}
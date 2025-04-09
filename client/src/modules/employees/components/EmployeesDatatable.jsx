import { useTranslation } from 'react-i18next'
import { DataTable } from '@/components/dataTable'
import { format } from 'date-fns'
import PropTypes from 'prop-types'

export const EmployeesDatatable = ({
  dataEmployees,
  onEditDialog,
}) => {
  const { t } = useTranslation()

  const columnDefEmployees = [
    {
      accessorKey: 'name',
      header: t('name'),
      cell: info => info.getValue()?.toUpperCase()
    },
    {
      accessorKey: 'lastName',
      header: t('last_name'),
      cell: info => info.getValue()?.toUpperCase()
    },
    {
      accessorKey: 'dni',
      header: t('dni'),
      cell: info => info.getValue()?.toUpperCase()
    },
    {
      accessorKey: 'email',
      header: t('email'),
      cell: info => info.getValue()?.toUpperCase()
    },
    {
      accessorKey: 'position',
      header: t('position'),
      cell: info => info.getValue()?.toUpperCase()
    },
    {
      accessorKey: 'department',
      header: t('department'),
      cell: info => info.getValue()?.toUpperCase()
    },
    {
      accessorKey: 'salary',
      header: t('salary'),
      cell: info => {
        const value = info.getValue()
        return value ? new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(value) : null
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

  return (
    <DataTable
      columns={columnDefEmployees}
      data={dataEmployees.data}
      handleRow={row => handleEditDialog(row)}
    />
  )
}

EmployeesDatatable.propTypes = {
  dataEmployees: PropTypes.object.isRequired,
  onEditDialog: PropTypes.func.isRequired
} 
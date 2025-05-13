import { useTranslation } from 'react-i18next'
import { DataTable } from '@/components/dataTable'
import { format } from 'date-fns'
import PropTypes from 'prop-types'

export const UsersDatatable = ({
  dataUsers,
  onEditDialog,
}) => {
  const { t } = useTranslation()

  const columnDefUsers = [
    {
      accessorKey: 'name',
      header: t('name'),
      cell: info => info.getValue()?.toUpperCase()
    },
    {
      accessorKey: 'email',
      header: t('email'),
      cell: info => info.getValue()?.toUpperCase()
    },
    {
      accessorKey: 'telephone',
      header: t('telephone'),
      cell: info => info.getValue()?.toUpperCase()
    },
    {
      accessorKey: 'address',
      header: t('address'),
      cell: info => info.getValue()?.toUpperCase()
    },
    {
      accessorKey: 'birthday',
      header: t('birthday'),
      cell: info => format(new Date(info.getValue()), 'PPP')
    },
    {
      accessorKey: 'startDate',
      header: t('start_date'),
      cell: info => format(new Date(info.getValue()), 'PPP')
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
      columns={columnDefUsers}
      data={dataUsers.data}
      handleRow={row => handleEditDialog(row)}
    />
  )
}

UsersDatatable.propTypes = {
  dataUsers: PropTypes.object.isRequired,
  onEditDialog: PropTypes.func.isRequired
}
import { useTranslation } from 'react-i18next'
import { DataTable } from '@/components/dataTable'
import { format } from 'date-fns'
import PropTypes from 'prop-types'

export const ClientsDatatable = ({
  dataClients,
  pagination,
  onPaginationChange,
  onEditDialog
}) => {
  const { t } = useTranslation()
  const { dataList, total } = dataClients.data

  const columnDefClients = [
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
      accessorKey: 'phone',
      header: t('phone'),
      cell: info => info.getValue()?.toUpperCase()
    },
    {
      accessorKey: 'address',
      header: t('address'),
      cell: info => info.getValue()?.toUpperCase()
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
      columns={columnDefClients}
      data={dataList}
      totalRows={total}
      handleRow={row => handleEditDialog(row)}
      pagination={pagination}
      onPaginationChange={onPaginationChange}
    />
  )
}

ClientsDatatable.propTypes = {
  dataClients: PropTypes.object.isRequired,
  onEditDialog: PropTypes.func.isRequired,
  pagination: PropTypes.object.isRequired,
  onPaginationChange: PropTypes.func.isRequired
}

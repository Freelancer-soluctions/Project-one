import { useTranslation } from 'react-i18next'
import { DataTable } from '@/components/dataTable'
import { format } from 'date-fns'
import PropTypes from 'prop-types'

export const WarehouseDatatable = ({
  dataWarehouse,
  onEditDialog,
}) => {
  const { t } = useTranslation()

  const columnDefWarehouse = [
    {
      accessorKey: 'name',
      header: t('name'),
      cell: info => info.getValue()?.toUpperCase()
    },
   {
    accessorKey: 'status',
    header: t('status'),
    cell: info => info.getValue()?.toUpperCase()
   },
   {
    accessorKey: 'description',
    header: t('description'),
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
    },
    
   
  ]

  const handleEditDialog = row => {
    onEditDialog(row)
  }

  return (
    <DataTable
      columns={columnDefWarehouse}
      data={dataWarehouse.data}
      handleRow={row => handleEditDialog(row)}
    />
  )
}

WarehouseDatatable.propTypes = {
  dataWarehouse: PropTypes.object.isRequired,
  onEditDialog: PropTypes.func.isRequired
}

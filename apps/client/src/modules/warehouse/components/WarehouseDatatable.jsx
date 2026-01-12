import { useTranslation } from 'react-i18next'
import { DataTable } from '@/components/dataTable'
import { format } from 'date-fns'
import PropTypes from 'prop-types'

export const WarehouseDatatable = ({
  dataWarehouse,
  onEditDialog,
  pagination,
  onPaginationChange
}) => {
  const { t } = useTranslation()
  const { dataList, total } = dataWarehouse.data

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
    }
  ]

  const handleEditDialog = row => {
    onEditDialog(row)
  }

  return (
    <DataTable
      columns={columnDefWarehouse}
      data={dataList}
      totalRows={total}
      handleRow={row => handleEditDialog(row)}
      pagination={pagination}
      onPaginationChange={onPaginationChange}
    />
  )
}

WarehouseDatatable.propTypes = {
  dataWarehouse: PropTypes.object.isRequired,
  onEditDialog: PropTypes.func.isRequired,
  pagination: PropTypes.object.isRequired,
  onPaginationChange: PropTypes.func.isRequired
}

import { useTranslation } from 'react-i18next'
import { DataTable } from '@/components/dataTable'
import { format } from 'date-fns'
import PropTypes from 'prop-types'

export const ProvidersDatatable = ({
  dataProviders,
  onEditDialog,
  pagination,
  onPaginationChange
}) => {
  const { t } = useTranslation()
  const { dataList, total } = dataProviders.data

  const columnDefProviders = [
    {
      accessorKey: 'name',
      header: t('name'),
      cell: info => info.getValue()?.toUpperCase()
    },
    {
      accessorKey: 'statusText',
      header: t('status'),
      cell: info => info.getValue()?.toUpperCase()
    },
    {
      accessorKey: 'createdOn',
      header: t('created_on'),
      cell: info => format(new Date(info.getValue()), 'PPP')
    },
    {
      accessorKey: 'userProvidersCreatedName',
      header: t('created_by'),
      cell: info => info.getValue()?.toUpperCase()
    },
    {
      accessorKey: 'userProvidersUpdatedName',
      header: t('updated_by'),
      cell: info => info.getValue()?.toUpperCase()
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
      columns={columnDefProviders}
      data={dataList}
      totalRows={total}
      handleRow={row => handleEditDialog(row)}
      pagination={pagination}
      onPaginationChange={onPaginationChange}
    />
  )
}

ProvidersDatatable.propTypes = {
  dataProviders: PropTypes.object.isRequired,
  onEditDialog: PropTypes.func.isRequired,
  pagination: PropTypes.object.isRequired,
  onPaginationChange: PropTypes.func.isRequired
}

import { useTranslation } from 'react-i18next'
import { DataTable } from '@/components/dataTable'
import { format } from 'date-fns'
import PropTypes from 'prop-types'

export const SettingsProductCategoriesDatatable = ({
  dataCategories,
  onEdit,
  pagination,
  onPaginationChange
}) => {
  const { t } = useTranslation()
  const { dataList, total } = dataCategories.data

  const columnDefCategories = [
    {
      accessorKey: 'code',
      header: t('code'),
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

  const handleEdit = row => {
    onEdit(row)
  }

  return (
    <DataTable
      columns={columnDefCategories}
      data={dataList}
      totalRows={total}
      handleRow={row => handleEdit(row)}
      pagination={pagination}
      onPaginationChange={onPaginationChange}
    />
  )
}

SettingsProductCategoriesDatatable.propTypes = {
  dataCategories: PropTypes.object.isRequired,
  onEdit: PropTypes.func.isRequired,
  pagination: PropTypes.object.isRequired,
  onPaginationChange: PropTypes.func.isRequired
}

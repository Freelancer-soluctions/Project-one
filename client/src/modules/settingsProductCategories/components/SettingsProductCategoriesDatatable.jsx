import { useTranslation } from 'react-i18next'
import { DataTable } from '@/components/dataTable'
import { format } from 'date-fns'
import PropTypes from 'prop-types'

export const SettingsProductCategoriesDatatable = ({
  dataCategories,
  onEdit,
}) => {
  const { t } = useTranslation()

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
      data={dataCategories.data}
      handleRow={row => handleEdit(row)}
    />
  )
}

SettingsProductCategoriesDatatable.propTypes = {
  dataCategories: PropTypes.object.isRequired,
  onEdit: PropTypes.func.isRequired,
} 
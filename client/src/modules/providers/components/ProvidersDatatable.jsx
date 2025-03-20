import { useTranslation } from 'react-i18next'
import { DataTable } from '@/components/dataTable'
import { format } from 'date-fns'
import PropTypes from 'prop-types'

export const ProvidersDatatable = ({
  dataProviders,
  onEditDialog,
}) => {
  const { t } = useTranslation()

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
    },
    
   
  ]

  const handleEditDialog = row => {
    onEditDialog(row)
  }

  return (
    <DataTable
      columns={columnDefProviders}
      data={dataProviders.data}
      handleRow={row => handleEditDialog(row)}
    />
  )
}

ProvidersDatatable.propTypes = {
  dataProviders: PropTypes.object.isRequired,
  onEditDialog: PropTypes.func.isRequired,

}

import { useTranslation } from 'react-i18next'
import { DataTable } from '@/components/dataTable'
import { format } from 'date-fns'
import PropTypes from 'prop-types'

export const ProvidersDatatable = ({
  dataStock,
  onEditDialog,
}) => {
  const { t } = useTranslation()

  const columnDefProviders = [
    {
      accessorKey: 'createdOn',
      header: t('created_on'),
      cell: info => format(new Date(info.getValue()), 'PPP')
    },
    {
      accessorKey: 'productName',
      header: t('product'),
      cell: info => info.getValue()?.toUpperCase()
    },
    {
      accessorKey: 'productPrice',
      header: t('price'),
      cell: info => info.getValue()?.toLocaleString('es-CO', { style: 'currency', currency: 'COP' })
    },
    {
      accessorKey: 'productCost',
      header: t('cost'),
      cell: info => info.getValue()?.toLocaleString('es-CO', { style: 'currency', currency: 'COP' })
    },
    {
      accessorKey: 'warehouseName',
      header: t('cost'),
      cell: info => info.getValue()?.toUpperCase()
    },
    {
      accessorKey: 'unitMeasure',
      header: t('unitMeasure'),
      cell: info => info.getValue()?.toUpperCase()
    },


    {
      accessorKey: 'userStockCreatedName',
      header: t('created_by'),
      cell: info => info.getValue()?.toUpperCase()

     
    },
    {
      accessorKey: 'userStockUpdatedName',
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
    {
      accessorKey: 'expirationDate',
      header: t('expiration_date'),
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
      data={dataStock.data}
      handleRow={row => handleEditDialog(row)}  
    />
  )
}

ProvidersDatatable.propTypes = {
  dataStock: PropTypes.object.isRequired,   
  onEditDialog: PropTypes.func.isRequired,

}

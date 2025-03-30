import { useTranslation } from 'react-i18next'
import { DataTable } from '@/components/dataTable'
import { format } from 'date-fns'
import PropTypes from 'prop-types'

export const PurchaseDatatable = ({
  dataPurchases,
  onEditDialog,
}) => {
  const { t } = useTranslation()

  const columnDefPurchases = [
    {
      accessorKey: 'provider.name',
      header: t('provider'),
      cell: info => info.getValue()?.toUpperCase()
    },
    {
      accessorKey: 'total',
      header: t('total'),
      cell: info => info.getValue()?.toLocaleString('es-CO', { style: 'currency', currency: 'COP' })
    },
    {
      accessorKey: 'purchaseDetail',
      header: t('products'),
      cell: info => info.getValue()?.length || 0
    },
    {
      accessorKey: 'createdOn',
      header: t('created_on'),
      cell: info => format(new Date(info.getValue()), 'PPP')
    },
    {accessorKey: 'userPurchaseCreated.name',
      header: t('created_by'),
      cell: info => {
        const userPurchaseCreated = info.row.original.userPurchaseCreated // Accede al dato original de la fila
        return userPurchaseCreated?.name ? userPurchaseCreated.name.toUpperCase() : null // Retorna null para mantener la celda vacía
      }
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
      accessorKey: 'userPurchaseUpdated.name',
      header: t('updated_by'),
      cell: info => {
        const userPurchaseUpdated = info.row.original.userPurchaseUpdated // Accede al dato original de la fila
        return userPurchaseUpdated?.name ? userPurchaseUpdated.name.toUpperCase() : null // Retorna null para mantener la celda vacía
      }
    }
  ]

  const handleEditDialog = row => {
    onEditDialog(row)
  }

  return (
    <DataTable
      columns={columnDefPurchases}
      data={dataPurchases.data}
      handleRow={row => handleEditDialog(row)}
    />
  )
}

PurchaseDatatable.propTypes = {
  dataPurchases: PropTypes.object.isRequired,
  onEditDialog: PropTypes.func.isRequired
} 
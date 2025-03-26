import { useTranslation } from 'react-i18next'
import { DataTable } from '@/components/dataTable'
import { format } from 'date-fns'
import PropTypes from 'prop-types'

export const SalesDatatable = ({
  dataSales,
  onEditDialog,
}) => {
  const { t } = useTranslation()

  const columnDefSales = [
    {
      accessorKey: 'client.name',
      header: t('client'),
      cell: info => info.getValue()?.toUpperCase()
    },
    {
      accessorKey: 'total',
      header: t('total'),
      cell: info => info.getValue()?.toLocaleString('es-CO', { style: 'currency', currency: 'COP' })
    },
    {
      accessorKey: 'saleDetail',
      header: t('products'),
      cell: info => info.getValue()?.length || 0
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
      columns={columnDefSales}
      data={dataSales.data}
      handleRow={row => handleEditDialog(row)}
    />
  )
}

SalesDatatable.propTypes = {
  dataSales: PropTypes.object.isRequired,
  onEditDialog: PropTypes.func.isRequired
} 
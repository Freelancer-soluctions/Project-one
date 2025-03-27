import { useTranslation } from 'react-i18next'
import { DataTable } from '@/components/ui/data-table'
import { format } from 'date-fns'
import PropTypes from 'prop-types'

const InventoryMovementDatatable = ({ dataInventoryMovements, onEditDialog }) => {
  const { t } = useTranslation()

  const columnDefInventoryMovements = [
    {
      accessorKey: 'product.name',
      header: t('product'),
      cell: ({ row }) => row.original.product.name.toUpperCase()
    },
    {
      accessorKey: 'warehouse.name',
      header: t('warehouse'),
      cell: ({ row }) => row.original.warehouse.name.toUpperCase()
    },
    {
      accessorKey: 'quantity',
      header: t('quantity'),
      cell: ({ row }) => row.original.quantity
    },
    {
      accessorKey: 'type',
      header: t('movement_type'),
      cell: ({ row }) => t(row.original.type.toLowerCase())
    },
    {
      accessorKey: 'reason',
      header: t('reason'),
      cell: ({ row }) => row.original.reason || '-'
    },
    {
      accessorKey: 'createdOn',
      header: t('created_on'),
      cell: ({ row }) => format(new Date(row.original.createdOn), 'PPP')
    },
    {
      accessorKey: 'updatedOn',
      header: t('updated_on'),
      cell: ({ row }) => (row.original.updatedOn ? format(new Date(row.original.updatedOn), 'PPP') : '-')
    }
  ]

  const handleEditDialog = row => {
    onEditDialog(row)
  }

  return (
    <DataTable
      columns={columnDefInventoryMovements}
      data={dataInventoryMovements}
      onEditDialog={handleEditDialog}
    />
  )
}

InventoryMovementDatatable.propTypes = {
  dataInventoryMovements: PropTypes.shape({
    data: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.number.isRequired,
        product: PropTypes.shape({
          name: PropTypes.string.isRequired
        }).isRequired,
        warehouse: PropTypes.shape({
          name: PropTypes.string.isRequired
        }).isRequired,
        quantity: PropTypes.number.isRequired,
        type: PropTypes.string.isRequired,
        reason: PropTypes.string,
        createdOn: PropTypes.string.isRequired,
        updatedOn: PropTypes.string
      })
    ).isRequired
  }).isRequired,
  onEditDialog: PropTypes.func.isRequired
}

export default InventoryMovementDatatable 
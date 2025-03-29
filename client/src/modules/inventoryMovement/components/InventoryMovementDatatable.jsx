import { useTranslation } from 'react-i18next'
import { DataTable } from '@/components/ui/datatable/DataTable'
import { format } from 'date-fns'
import PropTypes from 'prop-types'

const InventoryMovementDatatable = ({ dataInventoryMovements, onEditDialog }) => {
  const { t } = useTranslation()

  const columnDefInventoryMovements = [
    {
      accessorKey: 'product.name',
      header: t('product')
    },
    {
      accessorKey: 'warehouse.name',
      header: t('warehouse')
    },
    {
      accessorKey: 'quantity',
      header: t('quantity')
    },
    {
      accessorKey: 'type',
      header: t('type')
    },
    {
      accessorKey: 'reason',
      header: t('reason')
    },
    {
      accessorKey: 'createdOn',
      header: t('created_on'),
      cell: ({ row }) => format(new Date(row.original.createdOn), 'PPP')
    },
    {
      accessorKey: 'updatedOn',
      header: t('updated_on'),
      cell: ({ row }) =>
        row.original.updatedOn
          ? format(new Date(row.original.updatedOn), 'PPP')
          : ''
    }
  ]

  const handleEditDialog = row => {
    onEditDialog(row.original)
  }

  return (
    <DataTable
      columns={columnDefInventoryMovements}
      data={dataInventoryMovements.data}
      onEditRow={handleEditDialog}
    />
  )
}

InventoryMovementDatatable.propTypes = {
  dataInventoryMovements: PropTypes.object.isRequired,
  onEditDialog: PropTypes.func.isRequired
}

export default InventoryMovementDatatable 
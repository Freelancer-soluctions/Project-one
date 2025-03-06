import { DataTable } from '@/components/dataTable/index'
import { useTranslation } from 'react-i18next'
import { format } from 'date-fns'
import PropTypes from 'prop-types'

export const ProductsDatatable = ({
  dataProducts,
  onOpenProductsForms
  

}) => {
  const { t } = useTranslation()

  const columnDef = [
    {
      accessorKey: 'createdOn',
      header: t('created_on'),
      cell: info =>
        info.getValue() ? format(info.getValue(), 'dd/MM/yyyy') : ''
    },
    {
      accessorKey: 'sku',
      header: t('sku')
    },
    {
      accessorKey: 'name',
      header: t('name'),
      cell: info => {
        const value = info.getValue()
        return value.length > 30 ? `${value.slice(0, 30)}...` : value
      }
    },
    {
      accessorKey: 'categoryDescription',
      header: t('category')
    },
    {
      accessorKey: 'providerDescription',
      header: t('provider')
    },
    {
      accessorKey: 'price',
      header: t('price')
    },
    {
      accessorKey: 'cost',
      header: t('cost')
    },
    {
      accessorKey: 'stock',
      header: t('stock')
    },
    {
      accessorKey: 'userProductCreatedName',
      header: t('created_by'),
      cell: info => {
        const userCreated = info.row.original.userProductCreatedName // Accede al dato original de la fila
        return userCreated ? userCreated.toUpperCase() : null // Retorna null para mantener la celda vacía
      }
    },
    {
      accessorKey: 'userProductUpdatedName',
      header: t('updated_by'),
      cell: info => {
        const userUpdated = info.row.original.userProductUpdatedName // Accede al dato original de la fila
        return userUpdated ? userUpdated.toUpperCase() : null // Retorna null para mantener la celda vacía
      }
    },
    {
      accessorKey: 'updatedOn',
      header: t('updated_on'),
      cell: info =>
        info.getValue() ? format(info.getValue(), 'dd/MM/yyyy/hh:mm:s aaa') : ''
    },
   
  ]

  const handleEditDialog = row => {
    onOpenProductsForms(row)

  }

  return (
    <>
      <DataTable
        columns={columnDef}
        data={dataProducts?.data}
        handleRow={row => handleEditDialog(row)}
      />
    </>
  )
}

ProductsDatatable.propTypes = {
  dataProducts: PropTypes.object,
  setSelectedRow: PropTypes.func,
  setOpenDialog: PropTypes.func,
  setActionDialog: PropTypes.func
}

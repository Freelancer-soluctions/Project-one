import { StockFiltersForm, StockDialog, StockDatatable } from '../components'
import { BackDashBoard } from '@/components/backDash/BackDashBoard'
import { useTranslation } from 'react-i18next'
import { useState } from 'react'
import {
  useLazyGetAllStockQuery,
  useUpdateStockByIdMutation,
  useCreateStockMutation,
  useDeleteStockByIdMutation
} from '../api/stockAPI'
import AlertDialogComponent from '@/components/alertDialog/AlertDialog'
import { Spinner } from '@/components/loader/Spinner'
import {unitMeasures} from '../utils'


const Stock = () => {
  const { t } = useTranslation()
  const [selectedRow, setSelectedRow] = useState(null)
  const [openDialog, setOpenDialog] = useState(false)
  const [openAlertDialog, setOpenAlertDialog] = useState(false)
  const [alertProps, setAlertProps] = useState({})
  const [actionDialog, setActionDialog] = useState('')

  const [
    getAllStock,
    {
      data: dataStock = [],
      isLoading: isLoadingStock,
      isFetching: isFetchingStock
    }
  ] = useLazyGetAllStockQuery()

  const [
    updateStockById,
    { isLoading: isLoadingPut }
  ] = useUpdateStockByIdMutation()

  const [
    createStock,
    { isLoading: isLoadingPost }
  ] = useCreateStockMutation()

  const [
    deleteStockById,
    { isLoading: isLoadingDelete }
  ] = useDeleteStockByIdMutation()

  const handleSubmitFilters = data => {
    getAllStock(data)
  }

  const handleSubmit = async (values, stockId) => {
    try {
      const result = stockId
        ? await updateStockById({
            id: stockId,
            data: {
              quantity: Number(values.quantity),
              minimum: Number(values.minimum),
              maximum: values.maximum ? Number(values.maximum) : null,
              lot: values.lot,
              unitMeasure: values.unitMeasure,
              expirationDate: values.expirationDate,
              productId: Number(values.productId),
              warehouseId: Number(values.warehouseId)
            }
          }).unwrap()
        : await createStock({
            quantity: Number(values.quantity),
            minimum: Number(values.minimum),
            maximum: values.maximum ? Number(values.maximum) : null,
            lot: values.lot,
            unitMeasure: values.unitMeasure,
            expirationDate: values.expirationDate,
            productId: Number(values.productId),
            warehouseId: Number(values.warehouseId)
          }).unwrap()

      setAlertProps({
        alertTitle: t(stockId ? 'update_record' : 'add_record'),
        alertMessage: t(
          stockId ? 'updated_successfully' : 'added_successfully'
        ),
        cancel: false,
        success: true,
        onSuccess: () => {
          setOpenDialog(false)
        },
        variantSuccess: 'info'
      })
      setOpenAlertDialog(true)
    } catch (err) {
      console.error('Error:', err)
    }
  }

  const handleAddDialog = () => {
    setActionDialog(t('add_stock'))
    setOpenDialog(true)
  }

  const handleEditDialog = row => {
    setActionDialog(t('edit_stock'))
    setOpenDialog(true)
    setSelectedRow(row)
  }

  const handleCloseDialog = () => {
    setSelectedRow(null)
    setOpenDialog(false)
  }

  const handleDelete = async id => {
    try {
      setAlertProps({
        alertTitle: t('delete_record'),
        alertMessage: t('request_delete_record'),
        cancel: true,
        success: false,
        destructive: true,
        variantSuccess: '',
        variantDestructive: 'destructive',
        onSuccess: () => {},
        onDelete: async () => {
          try {
            await deleteStockById(id).unwrap()

            setAlertProps({
              alertTitle: '',
              alertMessage: t('deleted_successfully'),
              cancel: false,
              success: true,
              onSuccess: () => {
                setOpenDialog(false)
              },
              variantSuccess: 'info'
            })
            setOpenAlertDialog(true)
          } catch (err) {
            console.error('Error deleting:', err)
          }
        }
      })
      setOpenAlertDialog(true)
    } catch (err) {
      console.error('Error deleting:', err)
    }
  }

  return (
    <>
      <BackDashBoard link={'/home'} moduleName={t('stock')} />
      <div className='relative'>
        {(isLoadingStock ||
          isLoadingPut ||
          isLoadingPost ||
          isLoadingDelete ||
          isFetchingStock) && <Spinner />}

        <div className='grid grid-cols-2 grid-rows-4 gap-4 md:grid-cols-5'>
          {/* filters */}
          <div className='col-span-2 row-span-1 md:col-span-5'>
            <StockFiltersForm
              onSubmit={handleSubmitFilters}
              onAddDialog={handleAddDialog}
              unitMeasures={unitMeasures}
            />
          </div>
          {/* Datatable */}
          <div className='flex flex-wrap w-full col-span-2 row-span-3 row-start-2 md:col-span-5'>
            <StockDatatable
              dataStock={dataStock}
              onEditDialog={handleEditDialog}
            />
          </div>
          {/* Dialog */}
          <StockDialog
            openDialog={openDialog}
            onCloseDialog={handleCloseDialog}
            selectedRow={selectedRow}
            unitMeasures={unitMeasures}
            onSubmit={handleSubmit}
            onDeleteById={handleDelete}
            actionDialog={actionDialog}
          />

          <AlertDialogComponent
            openAlertDialog={openAlertDialog}
            setOpenAlertDialog={setOpenAlertDialog}
            alertProps={alertProps}
          />
        </div>
      </div>
    </>
  )
}

export default Stock
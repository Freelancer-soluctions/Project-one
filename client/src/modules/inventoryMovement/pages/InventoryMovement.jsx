import {
  InventoryMovementFiltersForm,
  InventoryMovementDialog,
  InventoryMovementDatatable
} from '../components'
import { BackDashBoard } from '@/components/backDash/BackDashBoard'
import { useTranslation } from 'react-i18next'
import { useState } from 'react'
import {
  useGetAllInventoryMovementsQuery,
  useUpdateInventoryMovementByIdMutation,
  useCreateInventoryMovementMutation,
  useDeleteInventoryMovementByIdMutation
} from '../api/inventoryMovementAPI'
import { useGetAllProductsQuery } from '@/modules/products/api/productsAPI'
import { useGetAllWarehousesQuery } from '@/modules/warehouse/api/warehouseAPI'
import AlertDialogComponent from '@/components/alertDialog/AlertDialog'
import { Spinner } from '@/components/loader/Spinner'

const InventoryMovement = () => {
  const { t } = useTranslation()
  const [selectedRow, setSelectedRow] = useState({})
  const [openDialog, setOpenDialog] = useState(false)
  const [openAlertDialog, setOpenAlertDialog] = useState(false)
  const [alertProps, setAlertProps] = useState({})
  const [actionDialog, setActionDialog] = useState('')

  const {
    data: dataInventoryMovements = { data: [] },
    isLoading: isLoadingInventoryMovements,
    isFetching: isFetchingInventoryMovements
  } = useGetAllInventoryMovementsQuery()

  const {
    data: dataProducts = { data: [] },
    isLoading: isLoadingProducts,
    isFetching: isFetchingProducts
  } = useGetAllProductsQuery()

  const {
    data: dataWarehouses = { data: [] },
    isLoading: isLoadingWarehouses,
    isFetching: isFetchingWarehouses
  } = useGetAllWarehousesQuery()

  const [
    updateInventoryMovementById,
    { isLoading: isLoadingPut, isError: isErrorPut, isSuccess: isSuccessPut }
  ] = useUpdateInventoryMovementByIdMutation()

  const [
    createInventoryMovement,
    { isLoading: isLoadingPost, isError: isErrorPost, isSuccess: isSuccessPost }
  ] = useCreateInventoryMovementMutation()

  const [
    deleteInventoryMovementById,
    {
      isLoading: isLoadingDelete,
      isError: isErrorDelete,
      isSuccess: isSuccessDelete
    }
  ] = useDeleteInventoryMovementByIdMutation()

  const handleSubmitFilters = data => {
    // TODO: Implement filters
    console.log('Filter data:', data)
  }

  const handleSubmit = async (values, inventoryMovementId) => {
    try {
      const result = inventoryMovementId
        ? await updateInventoryMovementById({
            id: inventoryMovementId,
            data: values
          }).unwrap()
        : await createInventoryMovement(values).unwrap()

      setAlertProps({
        alertTitle: t(inventoryMovementId ? 'update_record' : 'add_record'),
        alertMessage: t(
          inventoryMovementId ? 'updated_successfully' : 'added_successfully'
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
    setActionDialog(t('add_inventory_movement'))
    setOpenDialog(true)
  }

  const handleEditDialog = row => {
    setActionDialog(t('edit_inventory_movement'))
    setOpenDialog(true)
    setSelectedRow(row)
  }

  const handleCloseDialog = () => {
    setSelectedRow({})
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
            await deleteInventoryMovementById(id).unwrap()

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
      <BackDashBoard link={'/home'} moduleName={t('inventory_movements')} />
      <div className='relative'>
        {/* Show spinner when loading or fetching */}
        {(isLoadingInventoryMovements ||
          isLoadingPut ||
          isLoadingPost ||
          isLoadingProducts ||
          isLoadingDelete ||
          isLoadingWarehouses ||
          isFetchingInventoryMovements ||
          isFetchingWarehouses ||
          isFetchingProducts) && <Spinner />}

        <div className='grid grid-cols-2 grid-rows-4 gap-4 md:grid-cols-5'>
          {/* filters */}
          <div className='col-span-2 row-span-1 md:col-span-5'>
            <InventoryMovementFiltersForm
              onSubmit={handleSubmitFilters}
              onAddDialog={handleAddDialog}
              products={dataProducts.data}
              warehouses={dataWarehouses.data}
            />
          </div>
          {/* Datatable */}
          <div className='flex flex-wrap w-full col-span-2 row-span-3 row-start-2 md:col-span-5'>
            <InventoryMovementDatatable
              dataInventoryMovements={dataInventoryMovements}
              onEditDialog={handleEditDialog}
            />
          </div>
          {/* Dialog */}
          <InventoryMovementDialog
            openDialog={openDialog}
            onCloseDialog={handleCloseDialog}
            selectedRow={selectedRow}
            onSubmit={handleSubmit}
            onDeleteById={handleDelete}
            actionDialog={actionDialog}
            products={dataProducts.data}
            warehouses={dataWarehouses.data}
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

export default InventoryMovement 
import {
  WarehouseFiltersForm,
  WarehouseDialog,
  WarehouseDatatable
} from '../components'
import { BackDashBoard } from '@/components/backDash/BackDashBoard'
import { useTranslation } from 'react-i18next'
import { useState, useEffect } from 'react'
import {
  useLazyGetAllWarehousesQuery,
  useUpdateWarehouseByIdMutation,
  useCreateWarehouseMutation,
  useDeleteWarehouseByIdMutation
} from '../api/warehouseAPI'
import { dataStatus } from '../utils'
import AlertDialogComponent from '@/components/alertDialog/AlertDialog'
import { Spinner } from '@/components/loader/Spinner'

const Warehouse = () => {
  const { t } = useTranslation()
  const [selectedRow, setSelectedRow] = useState({})
  const [openDialog, setOpenDialog] = useState(false)
  const [openAlertDialog, setOpenAlertDialog] = useState(false)
  const [alertProps, setAlertProps] = useState({})
  const [actionDialog, setActionDialog] = useState('')
    const [pagination, setPagination] = useState({
      pageIndex: 0,
      pageSize: 20
    })
    const [filters, setFilters] = useState({})

  const [
    getAllWarehouse,
    {
      data: dataWarehouse = { data: [] },
      isLoading: isLoadingWarehouse,
      isFetching: isFetchingWarehouse
    }
  ] = useLazyGetAllWarehousesQuery()

  const [
    updateWarehouseById,
    { isLoading: isLoadingPut, isError: isErrorPut, isSuccess: isSuccessPut }
  ] = useUpdateWarehouseByIdMutation()

  const [
    createWarehouse,
    { isLoading: isLoadingPost, isError: isErrorPost, isSuccess: isSuccessPost }
  ] = useCreateWarehouseMutation()

  const [
    deleteWarehouseById,
    {
      isLoading: isLoadingDelete,
      isError: isErrorDelete,
      isSuccess: isSuccessDelete
    }
  ] = useDeleteWarehouseByIdMutation()

/**
   * Este efecto es la única fuente de verdad para disparar
   * la consulta al backend.
   *
   * Se ejecuta automáticamente:
   * - Al montar el componente (primer render)
   * - Cuando cambia la página
   * - Cuando cambia el tamaño de página
   * - Cuando cambian los filtros
   *
   * No se realizan llamadas manuales al backend desde handlers
   * para evitar duplicación de lógica y estados inconsistentes.
   */
  useEffect(() => {
    getAllWarehouse({
      page: pagination.pageIndex + 1,
      limit: pagination.pageSize,
      ...filters
    })
  }, [pagination.pageIndex, pagination.pageSize, filters])

  /**
   * Al aplicar nuevos filtros:
   * - Se resetea la página a la primera (pageIndex = 0)
   * - Se actualiza el estado de filtros
   *
   * No se llama directamente al backend aquí.
   * El cambio de estado dispara el useEffect, manteniendo
   * un flujo reactivo y predecible.
   */
  const handleSubmitFilters = newFilters => {
    setPagination(prev => ({
      ...prev,
      pageIndex: 0
    }))

    setFilters(newFilters)
  }



  const handleSubmit = async (values, warehouseId) => {
    try {
      const result = warehouseId
        ? await updateWarehouseById({
            id: warehouseId,
            data: {
              name: values.name,
              status: values.status,
              description: values.description,
              address: values.address
            }
          }).unwrap()
        : await createWarehouse({
            name: values.name,
            status: values.status,
            description: values.description,
            address: values.address
          }).unwrap()

      setAlertProps({
        alertTitle: t(warehouseId ? 'update_record' : 'add_record'),
        alertMessage: t(
          warehouseId ? 'updated_successfully' : 'added_successfully'
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
    setActionDialog(t('add_warehouse'))
    setOpenDialog(true)
  }

  const handleEditDialog = row => {
    setActionDialog(t('edit_warehouse'))
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
            await deleteWarehouseById(id).unwrap()

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
            setOpenAlertDialog(true) // Open alert dialog
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
      <BackDashBoard link={'/home'} moduleName={t('warehouse')} />
      <div className='relative'>
        {/* Show spinner when loading or fetching */}
        {(isLoadingWarehouse ||
          isLoadingPut ||
          isLoadingPost ||
          isLoadingDelete ||
          isFetchingWarehouse) && <Spinner />}

        <div className='grid grid-cols-2 grid-rows-4 gap-4 md:grid-cols-5'>
          {/* filters */}
          <div className='col-span-2 row-span-1 md:col-span-5'>
            <WarehouseFiltersForm
              onSubmit={handleSubmitFilters}
              dataStatus={dataStatus}
              onAddDialog={handleAddDialog}
            />
          </div>
          {/* Datatable */}
          <div className='flex flex-wrap w-full col-span-2 row-span-3 row-start-2 md:col-span-5'>
            <WarehouseDatatable
              dataWarehouse={dataWarehouse}
              onEditDialog={handleEditDialog}
                 pagination={pagination}
              onPaginationChange={setPagination}
            />
          </div>
          {/* Dialog */}
          <WarehouseDialog
            openDialog={openDialog}
            onCloseDialog={handleCloseDialog}
            selectedRow={selectedRow}
            dataStatus={dataStatus}
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

export default Warehouse

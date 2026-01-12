import {
  ProviderOrdersFiltersForm,
  ProviderOrdersDialog,
  ProviderOrdersDatatable
} from '../components'
import { BackDashBoard } from '@/components/backDash/BackDashBoard'
import { useTranslation } from 'react-i18next'
import { useState, useEffect } from 'react'
import {
  useLazyGetAllProviderOrdersQuery,
  useUpdateProviderOrderByIdMutation,
  useCreateProviderOrderMutation,
  useDeleteProviderOrderByIdMutation
} from '../api/providerOrderApi'
import AlertDialogComponent from '@/components/alertDialog/AlertDialog'
import { Spinner } from '@/components/loader/Spinner'

const ProviderOrders = () => {
  const { t } = useTranslation()
  const [selectedRow, setSelectedRow] = useState({})
  const [openDialog, setOpenDialog] = useState(false)
  const [openAlertDialog, setOpenAlertDialog] = useState(false)
  const [alertProps, setAlertProps] = useState({})
  const [actionDialog, setActionDialog] = useState('')

  const [
    getAllProviderOrders,
    {
      data: dataProviderOrders = { data: [] },
      isLoading: isLoadingProviderOrders,
      isFetching: isFetchingProviderOrders
    }
  ] = useLazyGetAllProviderOrdersQuery()

  const [
    updateProviderOrderById,
    { isLoading: isLoadingPut, isError: isErrorPut, isSuccess: isSuccessPut }
  ] = useUpdateProviderOrderByIdMutation()

  const [
    createProviderOrder,
    { isLoading: isLoadingPost, isError: isErrorPost, isSuccess: isSuccessPost }
  ] = useCreateProviderOrderMutation()

  const [
    deleteProviderOrderById,
    {
      isLoading: isLoadingDelete,
      isError: isErrorDelete,
      isSuccess: isSuccessDelete
    }
  ] = useDeleteProviderOrderByIdMutation()

  const handleSubmitFilters = data => {
    getAllProviderOrders({
      ...data
    })
  }

  const handleSubmit = async (values, providerOrderId) => {
    try {
      const result = providerOrderId
        ? await updateProviderOrderById({
            id: providerOrderId,
            data: {
              supplierId: values.supplierId,
              notes: values.notes
            }
          }).unwrap()
        : await createProviderOrder({
            supplierId: values.supplierId,
            notes: values.notes
          }).unwrap()

      setAlertProps({
        alertTitle: t(providerOrderId ? 'update_record' : 'add_record'),
        alertMessage: t(
          providerOrderId ? 'updated_successfully' : 'added_successfully'
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
    setActionDialog(t('add_provider_order'))
    setOpenDialog(true)
  }

  const handleEditDialog = row => {
    setActionDialog(t('edit_provider_order'))
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
            await deleteProviderOrderById(id).unwrap()

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
      <BackDashBoard link={'/home'} moduleName={t('provider_orders')} />
      <div className='relative'>
        {/* Show spinner when loading or fetching */}
        {(isLoadingProviderOrders ||
          isLoadingPut ||
          isLoadingPost ||
          isLoadingDelete ||
          isFetchingProviderOrders) && <Spinner />}

        <div className='grid grid-cols-2 grid-rows-4 gap-4 md:grid-cols-5'>
          {/* filters */}
          <div className='col-span-2 row-span-1 md:col-span-5'>
            <ProviderOrdersFiltersForm
              onSubmit={handleSubmitFilters}
              onAddDialog={handleAddDialog}
            />
          </div>
          {/* Datatable */}
          <div className='flex flex-wrap w-full col-span-2 row-span-3 row-start-2 md:col-span-5'>
            <ProviderOrdersDatatable
              dataProviderOrders={dataProviderOrders}
              onEditDialog={handleEditDialog}
            />
          </div>
          {/* Dialog */}
          <ProviderOrdersDialog
            openDialog={openDialog}
            onCloseDialog={handleCloseDialog}
            selectedRow={selectedRow}
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

export default ProviderOrders

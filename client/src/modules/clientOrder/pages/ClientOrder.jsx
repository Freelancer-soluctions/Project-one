import {
  ClientOrderFiltersForm,
  ClientOrderDialog,
  ClientOrderDatatable
} from '../components'
import { BackDashBoard } from '@/components/backDash/BackDashBoard'
import { useTranslation } from 'react-i18next'
import { useState, useEffect } from 'react'
import {
  useLazyGetAllClientOrderQuery,
  useUpdateClientOrderByIdMutation,
  useCreateClientOrderMutation,
  useDeleteClientOrderByIdMutation
} from '../api/clientOrderApi'
import AlertDialogComponent from '@/components/alertDialog/AlertDialog'
import { Spinner } from '@/components/loader/Spinner'

const ClientOrder = () => {
  const { t } = useTranslation()
  const [selectedRow, setSelectedRow] = useState({})
  const [openDialog, setOpenDialog] = useState(false)
  const [openAlertDialog, setOpenAlertDialog] = useState(false)
  const [alertProps, setAlertProps] = useState({})
  const [actionDialog, setActionDialog] = useState('')

  const [
    getAllClientOrder,
    {
      data: dataClientOrder = { data: [] },
      isLoading: isLoadingClientOrder,
      isFetching: isFetchingClientOrder
    }
  ] = useLazyGetAllClientOrderQuery()

  const [
    updateClientOrderById,
    { isLoading: isLoadingPut, isError: isErrorPut, isSuccess: isSuccessPut }
  ] = useUpdateClientOrderByIdMutation()

  const [
    createClientOrder,
    { isLoading: isLoadingPost, isError: isErrorPost, isSuccess: isSuccessPost }
  ] = useCreateClientOrderMutation()

  const [
    deleteClientOrderById,
    {
      isLoading: isLoadingDelete,
      isError: isErrorDelete,
      isSuccess: isSuccessDelete
    }
  ] = useDeleteClientOrderByIdMutation()

  const handleSubmitFilters = data => {
    getAllClientOrder({
      ...data
    })
  }

  const handleSubmit = async (values, clientOrderId) => {
    try {
      const result = clientOrderId
        ? await updateClientOrderById({
            id: clientOrderId,
            data: {
              clientId: values.clientId,
              status: values.status,
              notes: values.notes,
              saleId: values.saleId
            }
          }).unwrap()
        : await createClientOrder({
            clientId: values.clientId,
            status: values.status,
            notes: values.notes,
            saleId: values.saleId
          }).unwrap()

      setAlertProps({
        alertTitle: t(clientOrderId ? 'update_record' : 'add_record'),
        alertMessage: t(
          clientOrderId ? 'updated_successfully' : 'added_successfully'
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
    setActionDialog(t('add_clientOrder'))
    setOpenDialog(true)
  }

  const handleEditDialog = row => {
    setActionDialog(t('edit_clientOrder'))
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
            await deleteClientOrderById(id).unwrap()

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
      <BackDashBoard link={'/home'} moduleName={t('clientOrder')} />
      <div className='relative'>
        {/* Show spinner when loading or fetching */}
        {(isLoadingClientOrder ||
          isLoadingPut ||
          isLoadingPost ||
          isLoadingDelete ||
          isFetchingClientOrder) && <Spinner />}

        <div className='grid grid-cols-2 grid-rows-4 gap-4 md:grid-cols-5'>
          {/* filters */}
          <div className='col-span-2 row-span-1 md:col-span-5'>
            <ClientOrderFiltersForm
              onSubmit={handleSubmitFilters}
              onAddDialog={handleAddDialog}
            />
          </div>
          {/* Datatable */}
          <div className='flex flex-wrap w-full col-span-2 row-span-3 row-start-2 md:col-span-5'>
            <ClientOrderDatatable
              dataClientOrder={dataClientOrder}
              onEditDialog={handleEditDialog}
            />
          </div>
          {/* Dialog */}
          <ClientOrderDialog
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

export default ClientOrder
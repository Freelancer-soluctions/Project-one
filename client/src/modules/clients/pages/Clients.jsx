import {
  ClientsFiltersForm,
  ClientsDialog,
  ClientsDatatable
} from '../components'
import { BackDashBoard } from '@/components/backDash/BackDashBoard'
import { useTranslation } from 'react-i18next'
import { useState, useEffect } from 'react'
import {
  useLazyGetAllClientsQuery,
  useUpdateClientByIdMutation,
  useCreateClientMutation,
  useDeleteClientByIdMutation
} from '../api/clientsApi'
import AlertDialogComponent from '@/components/alertDialog/AlertDialog'
import { Spinner } from '@/components/loader/Spinner'

const Clients = () => {
  const { t } = useTranslation()
  const [selectedRow, setSelectedRow] = useState({})
  const [openDialog, setOpenDialog] = useState(false)
  const [openAlertDialog, setOpenAlertDialog] = useState(false)
  const [alertProps, setAlertProps] = useState({})
  const [actionDialog, setActionDialog] = useState('')

  const [
    getAllClients,
    {
      data: dataClients = { data: [] },
      isLoading: isLoadingClients,
      isFetching: isFetchingClients
    }
  ] = useLazyGetAllClientsQuery()

  const [
    updateClientById,
    { isLoading: isLoadingPut, isError: isErrorPut, isSuccess: isSuccessPut }
  ] = useUpdateClientByIdMutation()

  const [
    createClient,
    { isLoading: isLoadingPost, isError: isErrorPost, isSuccess: isSuccessPost }
  ] = useCreateClientMutation()

  const [
    deleteClientById,
    {
      isLoading: isLoadingDelete,
      isError: isErrorDelete,
      isSuccess: isSuccessDelete
    }
  ] = useDeleteClientByIdMutation()

  const handleSubmitFilters = data => {
    getAllClients({
      ...data
    })
  }

  const handleSubmit = async (values, clientId) => {
    try {
      const result = clientId
        ? await updateClientById({
            id: clientId,
            data: {
              name: values.name,
              email: values.email,
              phone: values.phone,
              address: values.address
            }
          }).unwrap()
        : await createClient({
            name: values.name,
            email: values.email,
            phone: values.phone,
            address: values.address
          }).unwrap()

      setAlertProps({
        alertTitle: t(clientId ? 'update_record' : 'add_record'),
        alertMessage: t(
          clientId ? 'updated_successfully' : 'added_successfully'
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
    setActionDialog(t('add_client'))
    setOpenDialog(true)
  }

  const handleEditDialog = row => {
    setActionDialog(t('edit_client'))
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
            await deleteClientById(id).unwrap()

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
      <BackDashBoard link={'/home'} moduleName={t('clients')} />
      <div className='relative'>
        {/* Show spinner when loading or fetching */}
        {(isLoadingClients ||
          isLoadingPut ||
          isLoadingPost ||
          isLoadingDelete ||
          isFetchingClients) && <Spinner />}

        <div className='grid grid-cols-2 grid-rows-4 gap-4 md:grid-cols-5'>
          {/* filters */}
          <div className='col-span-2 row-span-1 md:col-span-5'>
            <ClientsFiltersForm
              onSubmit={handleSubmitFilters}
              onAddDialog={handleAddDialog}
            />
          </div>
          {/* Datatable */}
          <div className='flex flex-wrap w-full col-span-2 row-span-3 row-start-2 md:col-span-5'>
            <ClientsDatatable
              dataClients={dataClients}
              onEditDialog={handleEditDialog}
            />
          </div>
          {/* Dialog */}
          <ClientsDialog
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

export default Clients 
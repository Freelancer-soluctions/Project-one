import {
  ProvidersFiltersForm,
  ProvidersDialog,
  ProvidersDatatable
} from '../components/index'
import { BackDashBoard } from '@/components/backDash/BackDashBoard'
import { useTranslation } from 'react-i18next'
import { useState } from 'react'
import {
  useLazyGetAllProvidersQuery,
  useUpdateProviderByIdMutation,
  useCreateProviderMutation,
  useDeleteProviderByIdMutation
} from '../api/providersAPI'
import { dataStatus } from '../utils/enums'
import AlertDialogComponent from '@/components/alertDialog/AlertDialog'
import { Spinner } from '@/components/loader/Spinner'
import { generateCode } from '@/utils/helpers'
import { useEffect } from 'react'

const Providers = () => {
  const { t } = useTranslation()
  const [selectedRow, setSelectedRow] = useState(null)
  const [openDialog, setOpenDialog] = useState(false)
  const [openAlertDialog, setOpenAlertDialog] = useState(false)
  const [alertProps, setAlertProps] = useState({})
  const [actionDialog, setActionDialog] = useState('')

  const [
    getAllProviders,
    {
      data: dataProviders = { data: [] },
      isLoading: isLoadingProviders,
      isFetching: isFetchingProviders
    }
  ] = useLazyGetAllProvidersQuery()
  const [
    updateProviderById,
    { isLoading: isLoadingPut, isError: isErrorPut, isSuccess: isSuccessPut }
  ] = useUpdateProviderByIdMutation()

  const [
    createProvider,
    { isLoading: isLoadingPost, isError: isErrorPost, isSuccess: isSuccessPost }
  ] = useCreateProviderMutation()
  const [
    deleteProviderById,
    {
      isLoading: isLoadingDelete,
      isError: isErrorDelete,
      isSuccess: isSuccessDelete
    }
  ] = useDeleteProviderByIdMutation()


  useEffect(() => {
    getAllProviders({name:'', status:true}); // Ejecuta la consulta cuando el componente se monta
  }, []); // <- Se ejecuta una vez al montar el componente

  const handleSubmitFilters = data => {
    getAllProviders(data)
  }

  const handleSubmit = async (values, providerId) => {
    try {
      const result = providerId
        ? await updateProviderById({
            id: providerId,
            data: {
              name: values.name,
              code: values.code,
              status: values.status,
              contactName: values.contactName,
              contactEmail: values.contactEmail,
              contactPhone: values.contactPhone,
              address: values.address
            }
          }).unwrap()
        : await createProvider({
            name: values.name,
            code: await generateCode(dataProviders?.data),
            status: values.status,
            contactName: values.contactName,
            contactEmail: values.contactEmail,
            contactPhone: values.contactPhone,
            address: values.address
          }).unwrap()

      setAlertProps({
        alertTitle: t(providerId ? 'update_record' : 'add_record'),
        alertMessage: t(
          providerId ? 'updated_successfully' : 'added_successfully'
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
    setActionDialog(t('add_provider'))
    setOpenDialog(true)
  }

  const handleEditDialog = row => {
    setActionDialog(t('edit_provider'))
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
            await deleteProviderById(id).unwrap()

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
      <BackDashBoard link={'/home'} moduleName={t('providers')} />
      <div className='relative'>
        {/* Show spinner when loading or fetching */}
        {(isLoadingProviders ||
          isLoadingPut ||
          isLoadingPost ||
          isLoadingDelete ||
          isFetchingProviders) && <Spinner />}

        <div className='grid grid-cols-2 grid-rows-4 gap-4 md:grid-cols-5'>
          {/* filters */}
          <div className='col-span-2 row-span-1 md:col-span-5'>
            <ProvidersFiltersForm
              onSubmit={handleSubmitFilters}
              dataStatus={dataStatus}
              onAddDialog={handleAddDialog}
            />
          </div>
          {/* Datatable */}
          <div className='flex flex-wrap w-full col-span-2 row-span-3 row-start-2 md:col-span-5'>
            <ProvidersDatatable
              dataProviders={dataProviders}
              onEditDialog={handleEditDialog}
            />
          </div>
          {/* Dialog */}
          <ProvidersDialog
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

export default Providers

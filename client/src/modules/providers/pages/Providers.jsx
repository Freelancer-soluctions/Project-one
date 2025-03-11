import { ProvidersFiltersForm, ProvidersDialog, ProvidersDatatable } from '../components/index'
import { BackDashBoard } from '@/components'
import { useTranslation } from 'react-i18next'
import { useState } from 'react'
import {
  useLazyGetAllProvidersQuery,
  useUpdateProviderByIdMutation,
  useCreateProviderMutation,
  useDeleteProviderByIdMutation
} from '../api/providersAPI'

const Providers = () => {
  const { t } = useTranslation()
  const [selectedRow, setSelectedRow] = useState(null)
  const [openDialog, setOpenDialog] = useState(false)
  const [openDialogDelete, setOpenDialogDelete] = useState(false)

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



  const handleSubmitFilters = data => {
    getAllProviders(data)
  }


  const handleSubmit = async (values, providerIdId) => {
    try {
      const result = newId
        ? await updateNewById({
            id: newId,
            data: {
              description: values.description,
              statusId: values.status.id,
              statusCode: values.status.code,
              document: values.document
            }
          }).unwrap()
        : await createNew({
            document: values.document,
            statusId: values.status.id,
            statusCode: values.status.code,
            description: values.description
          }).unwrap()

      setAlertProps({
        alertTitle: t(providerId ? 'update_record' : 'add_record'),
        alertMessage: t(providerIdId ? 'updated_successfully' : 'added_successfully'),
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


  const handleCreate = async data => {
    try {
      await createProvider(data).unwrap()
      handleCloseDialog()
    } catch (error) {
      console.error('Error creating provider:', error)
    }
  }

  const handleUpdate = async data => {
    try {
      await updateProviderById(data).unwrap()
      handleCloseDialog()
    } catch (error) {
      console.error('Error updating provider:', error)
    }
  }

  const handleDelete = async () => {
    try {
      await deleteProviderById(selectedRow.id).unwrap()
      handleCloseDialogDelete()
    } catch (error) {
      console.error('Error deleting provider:', error)
    }
  }

  const handleOpenDialog = row => {
    setSelectedRow(row)
    setOpenDialog(true)
  }

  const handleCloseDialog = () => {
    setSelectedRow(null)
    setOpenDialog(false)
  }

  const handleOpenDialogDelete = row => {
    setSelectedRow(row)
    setOpenDialogDelete(true)
  }

  const handleCloseDialogDelete = () => {
    setSelectedRow(null)
    setOpenDialogDelete(false)
  }

  return (
    <div className='container h-full px-4 mx-auto'>
      <BackDashBoard link={'/home'} moduleName={t('providers')} />
      <div className='flex flex-wrap -mx-4'>
        <div className='w-full px-4'>
          <div className='relative flex flex-col w-full min-w-0 mb-6 break-words border-0 rounded-lg shadow-lg bg-slate-100'>
            <div className='px-6 py-6 mb-0 bg-white rounded-t'>
              <div className='flex justify-between text-center'>
                <h6 className='text-xl font-bold text-slate-700'>
                  {t('providers')}
                </h6>
              </div>
            </div>
            <div className='flex-auto px-4 py-10 pt-0 lg:px-10'>
              <ProvidersFiltersForm
                onSubmit={handleSubmitFilters}
                dataStatus={dataStatus}
                isLoadingStatus={isLoadingStatus}
                isFetchingStatus={isFetchingStatus}
              />
              <ProvidersDatatable
                dataProviders={dataProviders}
                isLoadingProviders={isLoadingProviders}
                isFetchingProviders={isFetchingProviders}
                onEdit={handleOpenDialog}
                onDelete={handleOpenDialogDelete}
              />
              <ProvidersDialog
                open={openDialog}
                onClose={handleCloseDialog}
                onSubmit={selectedRow ? handleUpdate : handleCreate}
                selectedRow={selectedRow}
                dataStatus={dataStatus}
                isLoadingStatus={isLoadingStatus}
                isFetchingStatus={isFetchingStatus}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Providers

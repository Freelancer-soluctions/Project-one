import { useState } from 'react'
import {
  ProductsFiltersForm,
  ProductsDialog,
  ProductsDatatable
} from '../components/index'
import { Spinner } from '@/components/loader/Spinner'
import { BackDashBoard } from '@/components/backDash/BackDashBoard'
import AlertDialogComponent from '@/components/alertDialog/AlertDialog'

import {
  useLazyGetAllProductsQuery,
  useGetAllProductsStatusQuery,
  useUpdateProductByIdMutation,
  useCreateProductMutation,
  useDeleteProductByIdMutation
} from '../api/productsAPI'
import { useTranslation } from 'react-i18next'
const Products = () => {
  const [selectedRow, setSelectedRow] = useState({}) //data from datatable
  const [openDialog, setOpenDialog] = useState(false) //dialog open/close
  const [actionDialog, setActionDialog] = useState('') //actionDialog edit / add
  const [alertProps, setAlertProps] = useState({})
  const [openAlertDialog, setOpenAlertDialog] = useState(false) //alert dialog open/close
  const { t } = useTranslation() // Accede a las traducciones

  // filter form
  const [
    trigger,
    {
      data: dataNews = { data: [] },
      isError,
      isLoading,
      isFetching,
      isSuccess,
      error
    },
    lastPromiseInfo
  ] = useLazyGetAllProductsQuery()

  const {
    data: datastatus,
    isError: isErrorStatus,
    isLoading: isLoadingStatus,
    isFetching: isFetchingStatus,
    isSuccess: isSuccessStatus,
    error: errorStatus
  } = useGetAllProductsStatusQuery()

  const [
    updateNewById,
    { isLoading: isLoadingPut, isError: isErrorPut, isSuccess: isSuccessPut }
  ] = useUpdateProductByIdMutation()

  const [
    createNew,
    { isLoading: isLoadingPost, isError: isErrorPost, isSuccess: isSuccessPost }
  ] = useCreateProductMutation()

  const [
    deleteNewById,
    {
      isLoading: isLoadingDelete,
      isError: isErrorDelete,
      isSuccess: isSuccessDelete
    }
  ] = useDeleteProductByIdMutation()

  const handleSubmit = async (values, newId) => {
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
        alertTitle: t(newId ? 'update_record' : 'add_record'),
        alertMessage: t(newId ? 'updated_successfully' : 'added_successfully'),
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
            await deleteNewById(id).unwrap()

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
      <BackDashBoard link={'/home'} moduleName={t('products')} />
      <div className='relative'>
        {/* Show spinner when loading or fetching */}
        {(isLoading ||
          isLoadingStatus ||
          isLoadingPut ||
          isLoadingPost ||
          isLoadingDelete ||
          isFetching ||
          isFetchingStatus) && <Spinner />}

        <div className='grid grid-cols-2 grid-rows-4 gap-4 md:grid-cols-5'>
          {/* filters */}
          <div className='col-span-2 row-span-1 md:col-span-5'>
            <ProductsFiltersForm
              trigger={trigger}
              setActionDialog={setActionDialog}
              setOpenDialog={setOpenDialog}
              datastatus={datastatus}
            />
          </div>
          {/* Datatable */}
          <div className='flex flex-wrap w-full col-span-2 row-span-3 row-start-2 md:col-span-5'>
            <ProductsDatatable
              dataNews={dataNews}
              setSelectedRow={setSelectedRow}
              setOpenDialog={setOpenDialog}
              setActionDialog={setActionDialog}
            />
          </div>
          {/* Dialog */}
          <ProductsDialog
            openDialog={openDialog}
            setSelectedRow={setSelectedRow}
            selectedRow={selectedRow}
            setOpenDialog={setOpenDialog}
            actionDialog={actionDialog}
            datastatus={datastatus}
            onCreateUpdate={handleSubmit}
            onDeleteById={handleDelete}
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
export default Products

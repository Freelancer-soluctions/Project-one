import { PurchaseFiltersForm, PurchaseDialog, PurchaseDatatable } from '../components'
import { BackDashBoard } from '@/components/backDash/BackDashBoard'
import { useTranslation } from 'react-i18next'
import { useState, useEffect } from 'react'
import {
  useLazyGetAllPurchasesQuery,
  useUpdatePurchaseByIdMutation,
  useCreatePurchaseMutation,
  useDeletePurchaseByIdMutation
} from '../api/purchaseAPI'
import { useGetAllProductsQuery } from '@/modules/products/api/productsAPI'
import { useGetAllProvidersQuery } from '@/modules/providers/api/providersAPI'
import AlertDialogComponent from '@/components/alertDialog/AlertDialog'
import { Spinner } from '@/components/loader/Spinner'

const Purchase = () => {
  const { t } = useTranslation()
  const [selectedRow, setSelectedRow] = useState({})
  const [openDialog, setOpenDialog] = useState(false)
  const [openAlertDialog, setOpenAlertDialog] = useState(false)
  const [alertProps, setAlertProps] = useState({})
  const [actionDialog, setActionDialog] = useState('')

  const [
    getAllPurchases,
    {
      data: dataPurchases = { data: [] },
      isLoading: isLoadingPurchases,
      isFetching: isFetchingPurchases
    }
  ] = useLazyGetAllPurchasesQuery()

  const {
    data: dataProviders = { data: [] },
    isLoading: isLoadingProviders,
    isFetching: isFetchingProviders
  } = useGetAllProvidersQuery({name: '', status: true})

  const [
    updatePurchaseById,
    { isLoading: isLoadingPut, isError: isErrorPut, isSuccess: isSuccessPut }
  ] = useUpdatePurchaseByIdMutation()

  const [
    createPurchase,
    { isLoading: isLoadingPost, isError: isErrorPost, isSuccess: isSuccessPost }
  ] = useCreatePurchaseMutation()

  const [
    deletePurchaseById,
    {
      isLoading: isLoadingDelete,
      isError: isErrorDelete,
      isSuccess: isSuccessDelete
    }
  ] = useDeletePurchaseByIdMutation()

  const {
    data: dataProducts = { data: [] },
    isLoading: isLoadingProducts,
    isFetching: isFetchingProducts
  } = useGetAllProductsQuery()

  const handleSubmitFilters = ({ providerId, fromDate, toDate, minTotal, maxTotal }) => {
    getAllPurchases({ providerId, fromDate, toDate, minTotal, maxTotal })
  }

  const handleSubmit = async (values, purchaseId) => {
    try {
      const result = purchaseId
        ? await updatePurchaseById({
            id: purchaseId,
            data: {
              providerId: values.providerId,
              total: values.total,
              details: values.details
            }
          }).unwrap()
        : await createPurchase({
            providerId: values.providerId,
            total: values.total,
            details: values.details
          }).unwrap()

      setAlertProps({
        alertTitle: t(purchaseId ? 'update_record' : 'add_record'),
        alertMessage: t(purchaseId ? 'updated_successfully' : 'added_successfully'),
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
    setActionDialog(t('add_purchase'))
    setOpenDialog(true)
    setDetails([
      {
        productId: '',
        quantity: 0,
        price: 0
      }
    ])
    setSelectedRow({})
  }

  const handleEditDialog = row => {
    setActionDialog(t('edit_purchase'))
    setOpenDialog(true)
    setSelectedRow(row)
  }

  const handleCloseDialog = () => {
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
            await deletePurchaseById(id).unwrap()

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

  const handleEditDetail = (index, field, value) => {
    setDetails(prev =>
      prev.map((detail, i) =>
        i === index ? { ...detail, [field]: value, save: true } : detail
      )
    )
  }

  const handleRemoveDetail = async (index, item) => {
    //Eliminacion logica
    if (item.id) {
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
            await deletePurchaseDetailById(item.id).unwrap()
            updateDetails(index)
            setAlertProps({
              alertTitle: '',
              alertMessage: t('deleted_successfully'),
              cancel: false,
              success: true,
              onSuccess: () => {
                navigate('/home/products')
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
    } else {
      updateDetails(index)
    }
  }

  const updateDetails = index => {
    setDetails(prev => {
      const newDetails = [...prev]
      if (index !== -1) {
        newDetails.splice(index, 1) // Elimina el atributo en el índice encontrado
      }
      return newDetails
    })
  }

  useEffect(() => {
    if (dataPurchases?.data.length > 0) {
      setDetails(dataPurchases.data.details)
    }
  }, [dataPurchases])

  const [details, setDetails] = useState([
    {
      productId: '',
      quantity: 0,
      price: 0
    }
  ])

  const handleAddDetail = () => {
    setDetails([
      ...details,
      {
        productId: '',
        quantity: 0,
        price: 0
      }
    ])
  }

  return (
    <>
      <BackDashBoard link={'/home'} moduleName={t('purchases')} />
      <div className='relative'>
        {/* Show spinner when loading or fetching */}
        {(isLoadingPurchases ||
          isLoadingPut ||
          isLoadingPost ||
          isLoadingProducts ||
          isLoadingDelete ||
          isLoadingProviders ||
          isFetchingPurchases ||
          isFetchingProviders ||
          isFetchingProducts) && <Spinner />}

        <div className='grid grid-cols-2 grid-rows-4 gap-4 md:grid-cols-5'>
          {/* filters */}
          <div className='col-span-2 row-span-1 md:col-span-5'>
            <PurchaseFiltersForm
              onSubmit={handleSubmitFilters}
              onAddDialog={handleAddDialog}
              providers={dataProviders.data}
            />
          </div>
          {/* Datatable */}
          <div className='flex flex-wrap w-full col-span-2 row-span-3 row-start-2 md:col-span-5'>
            <PurchaseDatatable
              dataPurchases={dataPurchases}
              onEditDialog={handleEditDialog}
            />
          </div>
          {/* Dialog */}
          <PurchaseDialog
            openDialog={openDialog}
            onCloseDialog={handleCloseDialog}
            selectedRow={selectedRow}
            onSubmit={handleSubmit}
            onDeleteById={handleDelete}
            actionDialog={actionDialog}
            onEditDetail={handleEditDetail}
            onAddDetail={handleAddDetail}
            onRemoveDetail={handleRemoveDetail}
            products={dataProducts.data}
            details={details}
            providers={dataProviders.data}
            setDetails={setDetails}
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

export default Purchase 
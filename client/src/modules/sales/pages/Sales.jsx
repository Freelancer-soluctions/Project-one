import { SalesFiltersForm, SalesDialog, SalesDatatable } from '../components'
import { BackDashBoard } from '@/components/backDash/BackDashBoard'
import { useTranslation } from 'react-i18next'
import { useState, useEffect } from 'react'
import {
  useLazyGetAllSalesQuery,
  useUpdateSaleByIdMutation,
  useCreateSaleMutation,
  useDeleteSaleByIdMutation
} from '../api/salesAPI'
import { useGetAllProductsQuery } from '@/modules/products/api/productsAPI'
import { useGetAllClientsQuery } from '@/modules/clients/api/clientsApi'
import AlertDialogComponent from '@/components/alertDialog/AlertDialog'
import { Spinner } from '@/components/loader/Spinner'

const Sales = () => {
  const { t } = useTranslation()
  const [selectedRow, setSelectedRow] = useState({})
  const [openDialog, setOpenDialog] = useState(false)
  const [openAlertDialog, setOpenAlertDialog] = useState(false)
  const [alertProps, setAlertProps] = useState({})
  const [actionDialog, setActionDialog] = useState('')

  const [
    getAllSales,
    {
      data: dataSales = { data: [] },
      isLoading: isLoadingSales,
      isFetching: isFetchingSales
    }
  ] = useLazyGetAllSalesQuery()

  const {
    data: dataClients = { data: [] },
    isLoading: isLoadingClients,
    isFetching: isFetchingClients
  } = useGetAllClientsQuery()
  const [
    updateSaleById,
    { isLoading: isLoadingPut, isError: isErrorPut, isSuccess: isSuccessPut }
  ] = useUpdateSaleByIdMutation()

  const [
    createSale,
    { isLoading: isLoadingPost, isError: isErrorPost, isSuccess: isSuccessPost }
  ] = useCreateSaleMutation()

  const [
    deleteSaleById,
    {
      isLoading: isLoadingDelete,
      isError: isErrorDelete,
      isSuccess: isSuccessDelete
    }
  ] = useDeleteSaleByIdMutation()

  const {
    data: dataProducts = { data: [] },
    isLoading: isLoadingProducts,
    isFetching: isFetchingProducts
  } = useGetAllProductsQuery()

  const handleSubmitFilters = data => {
    getAllSales({
      ...data
    })
  }

  const handleSubmit = async (values, saleId) => {
    try {
      const result = saleId
        ? await updateSaleById({
            id: saleId,
            data: {
              clientId: values.clientId,
              total: values.total,
              details: values.details
            }
          }).unwrap()
        : await createSale({
            clientId: values.clientId,
            total: values.total,
            details: values.details
          }).unwrap()

      setAlertProps({
        alertTitle: t(saleId ? 'update_record' : 'add_record'),
        alertMessage: t(saleId ? 'updated_successfully' : 'added_successfully'),
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
    setActionDialog(t('add_sale'))
    setOpenDialog(true)
  }

  const handleEditDialog = row => {
    setActionDialog(t('edit_sale'))
    setOpenDialog(true)
    setSelectedRow(row)
  }

  const handleCloseDialog = () => {
    setSelectedRow({})
    setOpenDialog(false)
    setDetails([
      {
        productId: '',
        quantity: 0,
        price: 0
      }
    ])
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
            await deleteSaleById(id).unwrap()

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
            await deleteSaleDetailById(item.id).unwrap()
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
    if (dataSales?.data.length > 0) {
      setDetails(dataSales.data.details)
    }
  }, [dataSales])

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
      <BackDashBoard link={'/home'} moduleName={t('sales')} />
      <div className='relative'>
        {/* Show spinner when loading or fetching */}
        {(isLoadingSales ||
          isLoadingPut ||
          isLoadingPost ||
          isLoadingProducts ||
          isLoadingDelete ||
          isLoadingClients ||
          isFetchingSales ||
          isFetchingClients ||
          isFetchingProducts) && <Spinner />}

        <div className='grid grid-cols-2 grid-rows-4 gap-4 md:grid-cols-5'>
          {/* filters */}
          <div className='col-span-2 row-span-1 md:col-span-5'>
            <SalesFiltersForm
              onSubmit={handleSubmitFilters}
              onAddDialog={handleAddDialog}
              clients={dataClients.data}
            />
          </div>
          {/* Datatable */}
          <div className='flex flex-wrap w-full col-span-2 row-span-3 row-start-2 md:col-span-5'>
            <SalesDatatable
              dataSales={dataSales}
              onEditDialog={handleEditDialog}
            />
          </div>
          {/* Dialog */}
          <SalesDialog
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
            clients={dataClients.data}
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

export default Sales

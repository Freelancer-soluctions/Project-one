import { useState } from 'react'
import {
  ProductsFiltersForm,
  ProductsForms,
  ProductsDatatable
} from '../components/index'
import { Spinner } from '@/components/loader/Spinner'
import { BackDashBoard } from '@/components/backDash/BackDashBoard'
import AlertDialogComponent from '@/components/alertDialog/AlertDialog'

import {
  useLazyGetAllProductsQuery,
  useGetAllProductsStatusQuery,
  useGetAllProductCategoriesQuery,
  useGetAllProductTypesQuery,
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

  const {
    data: dataCategory,
    isError: isErrorCategory,
    isLoading: isLoadingCategory,
    isFetching: isFetchingCategory,
    isSuccess: isSuccessCategory,
    error: errorCategory
  } = useGetAllProductCategoriesQuery()

  const {
    data: dataTypes,
    isError: isErrorTypes,
    isLoading: isLoadingTypes,
    isFetching: isFetchingTypes,
    isSuccess: isSuccessTypes,
    error: errorTypes
  } = useGetAllProductTypesQuery()

  const {
    data: datastatus,
    isError: isErrorStatus,
    isLoading: isLoadingStatus,
    isFetching: isFetchingStatus,
    isSuccess: isSuccessStatus,
    error: errorStatus
  } = useGetAllProductsStatusQuery()

  // filter form
  const [
    trigger,
    {
      data: dataProducts = { data: [] },
      isError,
      isLoading,
      isFetching,
      isSuccess,
      error
    },
    lastPromiseInfo
  ] = useLazyGetAllProductsQuery()

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

  return (
    <>
      <BackDashBoard link={'/home'} moduleName={t('products')} />
      <div className='relative'>
        {/* Show spinner when loading or fetching */}
        {(isLoading ||
          isLoadingCategory ||
          isLoadingTypes ||
          isLoadingStatus ||
          isLoadingPut ||
          isLoadingPost ||
          isLoadingDelete ||
          isFetching ||
          isFetchingTypes ||
          isFetchingCategory ||
          isFetchingStatus) && <Spinner />}

        <div className='grid grid-cols-2 grid-rows-4 gap-4 md:grid-cols-5'>
          {/* filters */}
          <div className='col-span-2 row-span-1 md:col-span-5'>
            <ProductsFiltersForm
              trigger={trigger}
              setActionDialog={setActionDialog}
              setOpenDialog={setOpenDialog}
              datastatus={datastatus}
              dataCategory={dataCategory}
              dataTypes={dataTypes}
            />
          </div>
          {/* Datatable */}
          <div className='flex flex-wrap w-full col-span-2 row-span-3 row-start-2 md:col-span-5'>
            <ProductsDatatable
              dataProducts={dataProducts}
              setSelectedRow={setSelectedRow}
              setOpenDialog={setOpenDialog}
              setActionDialog={setActionDialog}
            />
          </div>
          <ProductsForms
            datastatus={datastatus}
            dataCategory={dataCategory}
            dataTypes={dataTypes}
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

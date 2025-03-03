import { useState } from 'react'
import { ProductsFiltersForm, ProductsDatatable } from '../components/index'
import { Spinner } from '@/components/loader/Spinner'
import { BackDashBoard } from '@/components/backDash/BackDashBoard'

import {
  useLazyGetAllProductsQuery,
  useGetAllProductsStatusQuery,
  useGetAllProductCategoriesQuery,
  useGetAllProductTypesQuery,

} from '../api/productsAPI'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
const Products = () => {

  const { t } = useTranslation() // Accede a las traducciones
  const navigate = useNavigate()

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


  const handleProductsForms = row => {
    navigate('/home/productsForms', { state: { row } })
  }

  return (
    <>
      <BackDashBoard link={'/home'} moduleName={t('products')} />
      <div className='relative'>
        {/* Show spinner when loading or fetching */}
        {(isLoading ||
          isLoadingCategory ||
          isLoadingTypes ||
          isLoadingStatus ||
          isFetching ||
          isFetchingTypes ||
          isFetchingCategory ||
          isFetchingStatus) && <Spinner />}

        <div className='grid grid-cols-2 grid-rows-4 gap-4 md:grid-cols-5'>
          {/* filters */}
          <div className='col-span-2 row-span-1 md:col-span-5'>
            <ProductsFiltersForm
              trigger={trigger}
              onOpenProductsForms={handleProductsForms}
              datastatus={datastatus}
              dataCategory={dataCategory}
              dataTypes={dataTypes}
            />
          </div>
          {/* Datatable */}
          <div className='flex flex-wrap w-full col-span-2 row-span-3 row-start-2 md:col-span-5'>
            <ProductsDatatable
              dataProducts={dataProducts}
              onOpenProductsForms={handleProductsForms}            
            />
          </div>

        
        </div>
      </div>
    </>
  )
}
export default Products

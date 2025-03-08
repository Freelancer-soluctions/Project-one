import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useTranslation } from 'react-i18next'
import { BackDashBoard } from '@/components/backDash/BackDashBoard'
import {
  useGetAllProductsStatusQuery,
  useGetAllProductCategoriesQuery,
  useGetAllProductProvidersQuery,
  useLazyGetAllProductAttributesQuery,
  useCreateProductMutation,
  useUpdateProductByIdMutation,
  useDeleteProductByIdMutation,
  useDeleteProductAttributeByIdMutation,
  useSaveProductAttributesMutation
} from '../api/productsAPI'
import { Spinner } from '@/components/loader/Spinner'
import { ProductBasicInfo, ProductAttributes } from '../components'
import AlertDialogComponent from '@/components/alertDialog/AlertDialog'
import { useNavigate, useLocation } from 'react-router'
import { useState, useEffect } from 'react'

function ProductsForms() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [selectedRow, setSelectedRow] = useState()
  const [openAlertDialog, setOpenAlertDialog] = useState(false) //alert dialog open/close
  const [alertProps, setAlertProps] = useState({})
  const location = useLocation()

  useEffect(() => {
    if (location.state?.row) {
      setSelectedRow(location.state.row)
    } else {
      setSelectedRow({})
    }
  }, [location.state])

  const {
    data: dataCategory,
    isError: isErrorCategory,
    isLoading: isLoadingCategory,
    isFetching: isFetchingCategory,
    isSuccess: isSuccessCategory,
    error: errorCategory
  } = useGetAllProductCategoriesQuery()

  const {
    data: dataProviders,
    isError: isErrorProviders,
    isLoading: isLoadingProviders,
    isFetching: isFetchingProviders,
    isSuccess: isSuccessProviders,
    error: errorProviders
  } = useGetAllProductProvidersQuery()

  const {
    data: datastatus,
    isError: isErrorStatus,
    isLoading: isLoadingStatus,
    isFetching: isFetchingStatus,
    isSuccess: isSuccessStatus,
    error: errorStatus
  } = useGetAllProductsStatusQuery()

  const [
    saveProduct,
    { isLoading: isLoadingPost, isError: isErrorPost, isSuccess: isSuccessPost }
  ] = useCreateProductMutation()
  const [
    updateProductById,
    { isLoading: isLoadingPut, isError: isErrorPut, isSuccess: isSuccessPut }
  ] = useUpdateProductByIdMutation()
  const [
    deleteProductById,
    {
      isLoading: isLoadingDelete,
      isError: isErrorDelete,
      isSuccess: isSuccessDelete
    }
  ] = useDeleteProductByIdMutation()

  const handleSubmitCreateEdit = async data => {
    if (!data) return

    if (data.id) {
      await updateProductById({
        id: data.id,
        data: {
          cost: data.cost,
          name: data.name,
          price: data.price,
          sku: data.sku,
          stock: data.stock,
          description: data.description,
          barCode: data.barCode,
          productCategoryId: data.category.id,
          productStatusId: data.status.id,
          productProviderId: data.provider.id
        }
      }).unwrap()
    } else {
      await saveProduct({
        cost: data.cost,
        name: data.name,
        price: data.price,
        sku: data.sku,
        stock: data.stock,
        description: data.description,
        barCode: data.barCode,
        productCategoryId: data.category.id,
        productStatusId: data.status.id,
        productProviderId: data.provider.id
      }).unwrap()
    }

    setOpenAlertDialog(true)
    setAlertProps({
      alertTitle: data.id ? t('update_record') : t('add_record'),
      alertMessage: data.id
        ? t('updated_successfully')
        : t('added_successfully'),
      cancel: false,
      success: true,
      onSuccess: () => {
        navigate('/home/products')
      },
      variantSuccess: 'info'
    })
  }

  const handleDeleteProductById = async id => {
    if (!id) return
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
            await deleteProductById(id).unwrap()

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
    } catch (err) {
      console.error('Error deleting:', err)
    }
  }

  const [
    getProductAttributes,
    {
      data: dataAttributes = { data: [] },
      isError: isErrorAttributes,
      isLoading: isLoadingAttributes,
      isFetching: isFetchingAttributes,
      isSuccess: isSuccessAttributes,
      error: errorAttributes
    }
  ] = useLazyGetAllProductAttributesQuery()

  const [
    deleteProductAttributeById,
    {
      isLoading: isLoadingDeleteAttribute,
      isError: isErrorDeleteAttribute,
      isSuccess: isSuccessDeleteAttribute
    }
  ] = useDeleteProductAttributeByIdMutation()

  const [
    saveProductAttributes,
    {
      isLoading: isLoadingSaveAttributes,
      isError: isErrorSaveAttributes,
      isSuccess: isSuccessPutSaveAttributes
    }
  ] = useSaveProductAttributesMutation()

  useEffect(() => {
    if (selectedRow?.id) {
      getProductAttributes(selectedRow.id)
    }
  }, [selectedRow])

  useEffect(() => {
    if (dataAttributes?.data.length > 0) {
      setAttributes(dataAttributes.data)
    }
  }, [dataAttributes])

  const [attributes, setAttributes] = useState([])

  const handleAddAttribute = () => {
    setAttributes([
      ...attributes,
      {
        createdOn: new Date(),
        name: '',
        description: '',
        save: true,
        productId: selectedRow?.id
      }
    ])
  }

  const updateAttributes = (index) => {
    setAttributes(prev => {
      const newAttributes = [...prev]
      if (index !== -1) {
        newAttributes.splice(index, 1) // Elimina el atributo en el índice encontrado
      }
      return newAttributes
    })
  };


  const handleRemoveAttribute = async (index, item) => {

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
            await deleteProductAttributeById(item.id).unwrap()
            updateAttributes(index)
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
    } else{updateAttributes(index)}
  }

  const handleEditAttribute = (index, field, value) => {
    setAttributes(prev =>
      prev.map((attr, i) =>
        i === index ? { ...attr, [field]: value, save: true } : attr
      )
    )
  }
  const handleSubmitFormAttribute = async data => {
    // Filtrar solo los atributos con save: true
    const attributesToSend = data
      .filter(attr => attr.save) // Solo los que tienen save: true
      .map(({ save, ...rest }) => rest) // Eliminar 'save' del objeto

    if (attributesToSend.length > 0) {
      await saveProductAttributes(attributesToSend).unwrap()

      setOpenAlertDialog(true)
      setAlertProps({
        alertTitle: t('save_record'),
        alertMessage: t('saved_successfully'),
        cancel: false,
        success: true,
        onSuccess: () => {
          navigate('/home/products')
        },
        variantSuccess: 'info'
      })
    }
  }

  return (
    <>
      <BackDashBoard
        link={'/home/products'}
        moduleName={selectedRow?.id ? t('edit_product') : t('new_product')}
      />
      <div className='relative'>
        {(isLoadingCategory ||
          isLoadingPost ||
          isLoadingPut ||
          isLoadingDelete ||
          isLoadingProviders ||
          isLoadingStatus ||
          isLoadingAttributes ||
          isLoadingDeleteAttribute ||
          isFetchingProviders ||
          isFetchingAttributes ||
          isFetchingCategory ||
          isFetchingStatus) && <Spinner />}

        <div className='container flex flex-col min-h-screen'>
          <main className='container flex-1 py-6'>
            <Tabs defaultValue='info' className='mb-6'>
              <TabsList className='grid w-full grid-cols-2'>
                <TabsTrigger value='info'>{t('basic_information')}</TabsTrigger>
                <TabsTrigger value='attributes'>{t('attributes')}</TabsTrigger>
              </TabsList>

              <TabsContent value='info' className='mt-4'>
                <ProductBasicInfo
                  onSubmitCreateEdit={handleSubmitCreateEdit}
                  onDelete={handleDeleteProductById}
                  dataCategory={dataCategory}
                  dataProviders={dataProviders}
                  datastatus={datastatus}
                  selectedRow={selectedRow}
                />
              </TabsContent>

              <TabsContent value='attributes' className='mt-4'>
                <ProductAttributes
                  onRemoveAttribute={handleRemoveAttribute}
                  onAddAttribute={handleAddAttribute}
                  onEditAttribute={handleEditAttribute}
                  attributes={attributes}
                  onSubmitFormAttributes={handleSubmitFormAttribute}
                />
              </TabsContent>
            </Tabs>
            <AlertDialogComponent
              openAlertDialog={openAlertDialog}
              setOpenAlertDialog={setOpenAlertDialog}
              alertProps={alertProps}
            />
          </main>
        </div>
      </div>
    </>
  )
}
export default ProductsForms

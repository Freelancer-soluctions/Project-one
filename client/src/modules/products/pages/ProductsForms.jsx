import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useTranslation } from 'react-i18next'
import { BackDashBoard } from '@/components/backDash/BackDashBoard'
import {
  useGetAllProductsStatusQuery,
  useGetAllProductCategoriesQuery,
  useGetAllProductTypesQuery,
  useCreateProductMutation
} from '../api/productsAPI'
import { Spinner } from '@/components/loader/Spinner'
import { ProductBasicInfo } from '../components'

function ProductsForms() {
  const { t } = useTranslation()

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

  const [
    saveProduct,
    { isLoading: isLoadingPost, isError: isErrorPost, isSuccess: isSuccessPost }
  ] = useCreateProductMutation()

  const handleSubmitCreateEdit = values => {
    if (!values) return
    saveProduct({ ...values })
  }

  //   const addComponent = () => {
  //     setComponents([...components, { id: Date.now(), name: '', quantity: 1 }])
  //   }

  //   const removeComponent = id => {
  //     setComponents(components.filter(component => component.id !== id))
  //   }

  //   const addSupplier = () => {
  //     setSuppliers([...suppliers, { id: Date.now(), name: '', price: '' }])
  //   }

  //   const removeSupplier = id => {
  //     setSuppliers(suppliers.filter(supplier => supplier.id !== id))
  //   }

  //   const addAttribute = () => {
  //     setAttributes([...attributes, { id: Date.now(), name: '', value: '' }])
  //   }

  //   const removeAttribute = id => {
  //     setAttributes(attributes.filter(attribute => attribute.id !== id))
  //   }

  return (
    <>
      <BackDashBoard link={'/home/products'} moduleName={t('new_product')} />
      <div className='relative'>
        {(isLoadingCategory ||
          isLoadingPost ||
          isLoadingTypes ||
          isLoadingStatus ||
          isFetchingTypes ||
          isFetchingCategory ||
          isFetchingStatus) && <Spinner />}

        <div className='container flex flex-col min-h-screen'>
          <main className='container flex-1 py-6'>
            <Tabs defaultValue='info' className='mb-6'>
              <TabsList className='grid w-full grid-cols-4'>
                <TabsTrigger value='info'>{t('basic_information')}</TabsTrigger>
                <TabsTrigger value='attributes'>{t('attributes')}</TabsTrigger>
                <TabsTrigger value='components'>{t('components')}</TabsTrigger>
                <TabsTrigger value='suppliers'>{t('providers')}</TabsTrigger>
              </TabsList>

              <TabsContent value='info' className='mt-4'>
                <ProductBasicInfo
                  onSubmitCreateEdit={handleSubmitCreateEdit}
                  dataCategory={dataCategory}
                  dataTypes={dataTypes}
                  datastatus={datastatus}
                />
              </TabsContent>

              {/* <TabsContent value='attributes' className='mt-4'>
        <Card>
          <CardHeader>
            <CardTitle>Atributos del Producto</CardTitle>
            <CardDescription>
              Agregue atributos personalizados al producto.
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            {attributes.map((attribute, index) => (
              <div key={attribute.id} className='flex items-end gap-4'>
                <div className='flex-1 space-y-2'>
                  <Label htmlFor={`attribute-name-${attribute.id}`}>
                    Nombre del Atributo
                  </Label>
                  <Input
                    id={`attribute-name-${attribute.id}`}
                    placeholder='Ej: Color, Tamaño, Material'
                  />
                </div>
                <div className='flex-1 space-y-2'>
                  <Label htmlFor={`attribute-value-${attribute.id}`}>
                    Valor
                  </Label>
                  <Input
                    id={`attribute-value-${attribute.id}`}
                    placeholder='Ej: Rojo, Grande, Algodón'
                  />
                </div>
                <Button
                  type='button'
                  variant='ghost'
                  size='icon'
                  onClick={() => removeAttribute(attribute.id)}>
                  <Trash2 className='w-4 h-4' />
                </Button>
              </div>
            ))}

            <Button type='button' variant='outline' onClick={addAttribute}>
              <Plus className='w-4 h-4 mr-2' />
              Agregar Atributo
            </Button>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value='components' className='mt-4'>
        <Card>
          <CardHeader>
            <CardTitle>Componentes del Producto</CardTitle>
            <CardDescription>
              Agregue los productos que componen este kit o combo.
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            {components.map((component, index) => (
              <div key={component.id} className='flex items-end gap-4'>
                <div className='flex-1 space-y-2'>
                  <Label htmlFor={`component-name-${component.id}`}>
                    Producto
                  </Label>
                  <Select>
                    <SelectTrigger id={`component-name-${component.id}`}>
                      <SelectValue placeholder='Seleccione un producto' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='laptop'>
                        Laptop HP Pavilion
                      </SelectItem>
                      <SelectItem value='monitor'>
                        Monitor LG 27"
                      </SelectItem>
                      <SelectItem value='keyboard'>
                        Teclado Mecánico RGB
                      </SelectItem>
                      <SelectItem value='mouse'>Mouse Gamer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className='w-[150px] space-y-2'>
                  <Label htmlFor={`component-quantity-${component.id}`}>
                    Cantidad
                  </Label>
                  <Input
                    id={`component-quantity-${component.id}`}
                    type='number'
                    defaultValue='1'
                    min='1'
                  />
                </div>
                <Button
                  type='button'
                  variant='ghost'
                  size='icon'
                  onClick={() => removeComponent(component.id)}>
                  <Trash2 className='w-4 h-4' />
                </Button>
              </div>
            ))}

            <Button type='button' variant='outline' onClick={addComponent}>
              <Plus className='w-4 h-4 mr-2' />
              Agregar Componente
            </Button>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value='suppliers' className='mt-4'>
        <Card>
          <CardHeader>
            <CardTitle>Proveedores</CardTitle>
            <CardDescription>
              Asocie proveedores a este producto.
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            {suppliers.map((supplier, index) => (
              <div key={supplier.id} className='flex items-end gap-4'>
                <div className='flex-1 space-y-2'>
                  <Label htmlFor={`supplier-name-${supplier.id}`}>
                    Proveedor
                  </Label>
                  <Select>
                    <SelectTrigger id={`supplier-name-${supplier.id}`}>
                      <SelectValue placeholder='Seleccione un proveedor' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='tech-wholesale'>
                        Tech Wholesale Inc.
                      </SelectItem>
                      <SelectItem value='global-electronics'>
                        Global Electronics
                      </SelectItem>
                      <SelectItem value='office-supplies'>
                        Office Supplies Co.
                      </SelectItem>
                      <SelectItem value='furniture-depot'>
                        Furniture Depot
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className='w-[200px] space-y-2'>
                  <Label htmlFor={`supplier-price-${supplier.id}`}>
                    Precio de Compra ($)
                  </Label>
                  <Input
                    id={`supplier-price-${supplier.id}`}
                    type='number'
                    placeholder='0.00'
                  />
                </div>
                <Button
                  type='button'
                  variant='ghost'
                  size='icon'
                  onClick={() => removeSupplier(supplier.id)}>
                  <Trash2 className='w-4 h-4' />
                </Button>
              </div>
            ))}

            <Button type='button' variant='outline' onClick={addSupplier}>
              <Plus className='w-4 h-4 mr-2' />
              Agregar Proveedor
            </Button>
          </CardContent>
        </Card>
      </TabsContent> */}
            </Tabs>
          </main>
        </div>
      </div>
    </>
  )
}
export default ProductsForms

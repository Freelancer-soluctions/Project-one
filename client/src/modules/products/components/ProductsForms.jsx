import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Package, ArrowLeft, Plus, Trash2, Barcode, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form'
import { useTranslation } from 'react-i18next'
import { BackDashBoard } from '@/components/backDash/BackDashBoard'
import {productSchema} from '../utils/index'

export function ProductsForms({ datastatus,
  dataCategory,
  dataTypes}) {
  const [barcode, setBarcode] = useState('')
  const { t } = useTranslation()

  const generateBarcode = () => {
    // Simulación de generación de código de barras
    const randomCode = Math.floor(Math.random() * 10000000000)
      .toString()
      .padStart(10, '0')
    setBarcode(randomCode)
  }

  const form = useForm({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      category: '',
      type: '',
      status: ''
    }
  })

  const onSubmitCreate = (values) => {
    trigger({ ...values})
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
    <div className='flex flex-col min-h-screen'>
      <main className='container flex-1 py-6'>
        <BackDashBoard link={'/home/products'} moduleName={t('new_product')} />

        <Tabs defaultValue='info' className='mb-6'>
          <TabsList className='grid w-full grid-cols-4'>
            <TabsTrigger value='info'>{t('basic_information')}</TabsTrigger>
            <TabsTrigger value='attributes'>{t('attributes')}</TabsTrigger>
            <TabsTrigger
              value='components'
              >
              {t('components')}
            </TabsTrigger>
            <TabsTrigger value='suppliers'>{t('providers')}</TabsTrigger>
          </TabsList>

          <TabsContent value='info' className='mt-4'>
            <Card>
              <CardHeader>
                <CardTitle>{t('product_information')}</CardTitle>
                <CardDescription>
                  {t('product_basic_information_msg')}
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                <Form {...form}>
                  <form
                    method='post'
                    action=''
                    id='profile-info-form'
                    noValidate
                    onSubmit={form.handleSubmit(onSubmitCreate)}
                    className='flex flex-col flex-wrap gap-5'>
                    <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                      <div className='space-y-2'>
                        <FormField
                          control={form.control}
                          name='name'
                          render={({ field }) => {
                            return (
                              <FormItem>
                                <FormLabel htmlFor='name'>
                                  {t('name')}*
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    id='name'
                                    type='text'
                                    name='name'
                                    autoComplete='false'
                                    placeholder={t(
                                      'enter_product_name_placeholder'
                                    )}
                                    {...field}
                                    value={field.value ?? ''}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )
                          }}
                        />
                      </div>
                      <div className='space-y-2'>
                   

                        <FormField
                          control={form.control}
                          name='sku'
                          render={({ field }) => {
                            return (
                              <FormItem>
                                <FormLabel htmlFor='sku'>{t('sku')}*</FormLabel>
                                <FormControl>
                                  <Input
                                    id='sku'
                                    type='text'
                                    name='sku'
                                    autoComplete='false'
                                    placeholder={t(
                                      'enter_unique_product_code_placeholder'
                                    )}
                                    {...field}
                                    value={field.value ?? ''}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )
                          }}
                        />
                      </div>
                    </div>

                    <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                      <div className='space-y-2'>
                        <FormField
                          control={form.control}
                          name='category'
                          render={({ field }) => {
                            return (
                              <FormItem>
                                <FormLabel htmlFor='status'>
                                  {t('category')}*
                                </FormLabel>
                                <Select
                                  onValueChange={field.onChange}
                                  value={field.value}>
                                  <FormControl id='category'>
                                    <SelectTrigger>
                                      <SelectValue
                                        placeholder={t('select_category')}
                                      />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {dataCategory?.data.map((item, index) => (
                                      <SelectItem value={item.code} key={index}>
                                        {item.description}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )
                          }}
                        />
                      </div>
                      <div className='space-y-2'>
                        <FormField
                          control={form.control}
                          name='type'
                          render={({ field }) => {
                            return (
                              <FormItem>
                                <FormLabel htmlFor='type'>
                                  {t('type')}*
                                </FormLabel>
                                <Select
                                  onValueChange={field.onChange}
                                  value={field.value}>
                                  <FormControl id='type'>
                                    <SelectTrigger>
                                      <SelectValue
                                        placeholder={t('select_type')}
                                      />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {dataTypes?.data.map((item, index) => (
                                      <SelectItem value={item.code} key={index}>
                                        {item.description}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )
                          }}
                        />
                      </div>
                    </div>

                    <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
                      <div className='space-y-2'>
                        <FormField
                          control={form.control}
                          name='price'
                          render={({ field }) => {
                            return (
                              <FormItem>
                                <FormLabel htmlFor='price'>
                                  {t('price')}*
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    id='price'
                                    type='number'
                                    placeholder='0.00'
                                    name='price'
                                    autoComplete='false'
                                    {...field}
                                    value={field.value ?? ''}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )
                          }}
                        />
                      </div>
                      <div className='space-y-2'>
                        <FormField
                          control={form.control}
                          name='cost'
                          render={({ field }) => {
                            return (
                              <FormItem>
                                <FormLabel htmlFor='price'>
                                  {t('cost')}*
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    id='cost'
                                    type='number'
                                    placeholder='0.00'
                                    name='cost'
                                    autoComplete='false'
                                    {...field}
                                    value={field.value ?? ''}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )
                          }}
                        />
                      </div>
                      <div className='space-y-2'>
                        <FormField
                          control={form.control}
                          name='stock'
                          render={({ field }) => {
                            return (
                              <FormItem>
                                <FormLabel htmlFor='stock'>
                                  {t('initial_stock')}*
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    id='stock'
                                    type='number'
                                    placeholder='0'
                                    name='stock'
                                    autoComplete='false'
                                    {...field}
                                    value={field.value ?? ''}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )
                          }}
                        />
                      </div>
                    </div>

                    <div className='space-y-2'>
                      <FormField
                        control={form.control}
                        name='description'
                        render={({ field }) => {
                          return (
                            <FormItem className='flex flex-col flex-auto col-span-2'>
                              <FormLabel htmlFor='description'>
                                {t('description')}
                              </FormLabel>
                              <FormControl>
                                <Textarea
                                  id='description'
                                  placeholder={t(
                                    'detailed_product_description_placeholder'
                                  )}
                                  className='resize-none'
                                  autoComplete='false'
                                  maxLength={2000}
                                  {...field}
                                  value={field.value ?? ''}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )
                        }}
                      />
                    </div>

                    <div className='space-x-2'>
                      <FormField
                        control={form.control}
                        name='status'
                        render={({ field }) => {
                          return (
                            <FormItem>
                              <FormLabel htmlFor='status'>
                                {t('status')}*
                              </FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                value={field.value}>
                                <FormControl id='status'>
                                  <SelectTrigger>
                                    <SelectValue
                                      placeholder={t('select_status')}
                                    />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {datastatus?.data.map((item, index) => (
                                    <SelectItem value={item.code} key={index}>
                                      {item.description}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )
                        }}
                      />
                    </div>

                    <div className='space-y-2'>
                      <div className='flex gap-2'>
                        <FormField
                          control={form.control}
                          name='barcode'
                          render={({ field }) => {
                            return (
                              <FormItem>
                                <FormLabel htmlFor='barcode'>
                                  {t('barcode')}
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    id='barcode'
                                    type='text'
                                    name='barcode'
                                    autoComplete='false'
                                    placeholder={t(
                                      'generate_barcode_automatically_placeholder'
                                    )}
                                    {...field}
                                    value={field.value ?? ''}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )
                          }}
                        />
                        <Button
                          type='button'
                          variant='outline'
                          onClick={generateBarcode}>
                          <Barcode className='w-4 h-4 mr-2' />
                          {t('generate')}
                        </Button>
                      </div>
                    </div>
                    <div className='flex flex-wrap items-center justify-between gap-3 mt-5 md:justify-normal'>
                      <Button type='button' variant='secondary'>
                        {t('cancel')}
                      </Button>
                      <Button type='submit' variant='info'>
                        {t('save')}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
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
  )
}

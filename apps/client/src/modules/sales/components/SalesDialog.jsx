import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { LuTrash2, LuShoppingCart, LuPlus } from 'react-icons/lu'
import PropTypes from 'prop-types'
import { SaleSchema } from '../utils'
import { useState, useCallback } from 'react'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/components/ui/use-toast'

export const SalesDialog = ({
  openDialog,
  onCloseDialog,
  selectedRow,
  onSubmit,
  onDeleteById,
  actionDialog,
  onEditDetail,
  onAddDetail,
  onRemoveDetail,
  products,
  details,
  clients,
  setDetails
}) => {
  const { t } = useTranslation()
  const [saleId, setSaleId] = useState(null)
  const { toast } = useToast()

  const form = useForm({
    resolver: zodResolver(SaleSchema),
    defaultValues: {
      clientId: '',
      total: '',
      createdOn: '',
      updatedOn: '',
      details: [
        {
          productId: '',
          quantity: 0,
          price: 0
        }
      ]
    }
  })

  // Actualiza todos los valores del formulario al cambiar `selectedRow`
  useEffect(() => {
    if (selectedRow?.id) {
      // Filtra y mapea solo los valores necesarios
      const mappedValues = {
        id: selectedRow.id,
        clientId: selectedRow.clientId.toString(),
        total: selectedRow.total.toString(),
        createdOn: new Date(selectedRow.createdOn).toISOString().split('T')[0],
        updatedOn: selectedRow.updatedOn
          ? new Date(selectedRow.updatedOn).toISOString().split('T')[0]
          : '',
        userSaleCreatedName: selectedRow.userSaleCreated?.name,
        userSaleUpdatedName: selectedRow.userSaleUpdated?.name || '',
        details: selectedRow.saleDetail.map(detail => ({
          productId: detail.productId.toString(),
          quantity: detail.quantity.toString(),
          price: detail.price.toString()
        }))
      }

      form.reset(mappedValues)
      setSaleId(mappedValues.id)
      setDetails(mappedValues.details)
    } else {
      // Reset form when selectedRow is null
      clearDialog()
    }
  }, [selectedRow])

  const handleSubmit = data => {
    onSubmit(data, saleId)
  }

  const clearDialog = () => {
    form.reset()
    setSaleId(null)
  }

  const handleDelete = () => {
    onDeleteById(saleId)
    // Reset form and details state
    clearDialog()
    onCloseDialog()
  }

  const calculateTotal = useCallback(() => {
    if (details?.length > 0) {
      const newTotal = details.reduce((sum, detail) => {
        const price = Number(detail.price) || 0
        const quantity = Number(detail.quantity) || 0
        return sum + price * quantity
      }, 0)
      form.setValue('total', newTotal.toFixed(2).toString())
    }
  }, [details, form])

  const handleProductChange = (index, value) => {
    if (details?.length > 0) {
      const productExist = details.filter(detail => detail.productId === value)
      if (productExist?.length > 0) {
        toast({
          title: t('product_already_exists'),
          description: t('product_already_exists_message'),
          variant: 'destructive'
        })
        return
      }

      const selectedProduct = products.find(
        product => product.id.toString() === value
      )

      if (selectedProduct) {
        // Actualizar el detalle
        const updatedDetails = [...details]
        updatedDetails[index] = {
          ...updatedDetails[index],
          productId: value,
          price: selectedProduct.price
        }
        setDetails(updatedDetails)

        // Actualizar el formulario
        form.setValue(`details.${index}.price`, selectedProduct.price)

        // Calcular el total
        calculateTotal()
      }
    }
  }

  const handleQuantityChange = (index, value) => {
    if (details?.length > 0) {
      const quantity = Number(value) || 0
      if (quantity < 1) return

      // Actualizar el detalle
      const updatedDetails = [...details]
      updatedDetails[index] = {
        ...updatedDetails[index],
        quantity: quantity
      }
      setDetails(updatedDetails)

      // Actualizar el formulario
      form.setValue(`details.${index}.quantity`, quantity.toString(), {
        shouldValidate: true,
        shouldDirty: true
      })

      // Calcular el total
      calculateTotal()
    }
  }

  // Calcular el total cuando cambian los detalles
  useEffect(() => {
    calculateTotal()
  }, [details, calculateTotal])

  const handleCloseDialog = () => {
    clearDialog()
    onCloseDialog()
  }

  return (
    <Dialog
      open={openDialog}
      onOpenChange={isOpen => {
        if (isOpen === true) return
        handleCloseDialog()
      }}>
      <DialogContent className='sm:max-w-[800px]'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <LuShoppingCart className='inline mr-3 w-7 h-7' />
            {actionDialog}
          </DialogTitle>
          <DialogDescription>
            {saleId ? t('edit_message') : t('add_message')}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            method='post'
            action=''
            id='sale-form'
            noValidate
            onSubmit={form.handleSubmit(handleSubmit)}
            className='flex flex-col flex-wrap gap-5 px-4'>
            <div className='grid grid-cols-1 gap-6 py-4 auto-rows-auto md:grid-cols-2'>
              <FormField
                control={form.control}
                name='clientId'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('client')}*</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('select_client')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {clients?.map(client => (
                          <SelectItem
                            key={client.id}
                            value={client.id.toString()}>
                            {client.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='total'
                render={({ field }) => {
                  return (
                    <FormItem>
                      <FormLabel htmlFor='total'>{t('total')}</FormLabel>
                      <FormControl>
                        <Input
                          id='total'
                          name='total'
                          type='number'
                          placeholder='0.00'
                          autoComplete='off'
                          disabled={true}
                          {...field}
                          value={field.value}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )
                }}
              />

              {selectedRow?.createdOn && (
                <>
                  <FormField
                    control={form.control}
                    name='userSaleCreatedName'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel htmlFor='userSaleCreatedName'>
                          {t('created_by')}
                        </FormLabel>
                        <FormControl>
                          <Input
                            id='userSaleCreatedName'
                            name='userSaleCreatedName'
                            disabled
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name='createdOn'
                    render={({ field }) => (
                      <FormItem className='flex flex-col flex-auto'>
                        <FormLabel htmlFor='createdOn'>
                          {t('created_on')}
                        </FormLabel>
                        <FormControl>
                          <Input
                            id='createdOn'
                            name='createdOn'
                            disabled
                            type='date'
                            {...field}
                            value={field.value}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}
              {selectedRow?.updatedOn && (
                <>
                  <FormField
                    control={form.control}
                    name='userSaleUpdatedName'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel htmlFor='userSaleUpdatedName'>
                          {t('updated_by')}
                        </FormLabel>
                        <FormControl>
                          <Input
                            id='userSaleUpdatedName'
                            name='userSaleUpdatedName'
                            disabled
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name='updatedOn'
                    render={({ field }) => (
                      <FormItem className='flex flex-col flex-auto'>
                        <FormLabel htmlFor='updatedOn'>
                          {t('updated_on')}
                        </FormLabel>
                        <FormControl>
                          <Input
                            id='updatedOn'
                            name='updatedOn'
                            disabled
                            type='date'
                            {...field}
                            value={field.value}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}
            </div>
            <Separator className='my-4' />
            <div className='space-y-4 overflow-y-auto max-h-80'>
              {details?.map((detail, index) => (
                <div
                  key={index}
                  className='flex flex-wrap items-end gap-4 pb-4 mb-4 border-b border-gray-200'>
                  <FormField
                    control={form.control}
                    name={`details.${index}.productId`}
                    render={({ field }) => (
                      <FormItem className='flex flex-col flex-auto'>
                        <FormLabel htmlFor={`detail-product-${index}`}>
                          {t('product')}*
                        </FormLabel>
                        <Select
                          onValueChange={value => {
                            field.onChange(value)
                            handleProductChange(index, value)
                          }}
                          defaultValue={field.value}
                          value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t('select_product')} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {products?.map(product => (
                              <SelectItem
                                key={product.id}
                                value={product.id.toString()}>
                                {product.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`details.${index}.quantity`}
                    render={({ field }) => {
                      return (
                        <FormItem className='flex flex-col flex-auto'>
                          <FormLabel htmlFor={`detail-quantity-${index}`}>
                            {t('quantity')}*
                          </FormLabel>
                          <FormControl>
                            <Input
                              id={`detail-quantity-${index}`}
                              name={`details.${index}.quantity`}
                              placeholder={t('quantity_placeholder')}
                              type='number'
                              min='1'
                              autoComplete='off'
                              value={field.value ?? ''}
                              onChange={e => {
                                const value = e.target.value
                                handleQuantityChange(index, value)
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )
                    }}
                  />
                  <FormField
                    control={form.control}
                    name={`details.${index}.price`}
                    render={({ field }) => {
                      return (
                        <FormItem className='flex flex-col flex-auto'>
                          <FormLabel htmlFor={`detail-price-${index}`}>
                            {t('price')}*
                          </FormLabel>
                          <FormControl>
                            <Input
                              id={`detail-price-${index}`}
                              type='number'
                              placeholder='0.00'
                              name={`details.${index}.price`}
                              autoComplete='off'
                              disabled={true}
                              {...field}
                              value={field.value ?? ''}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )
                    }}
                  />

                  {/* Botón de eliminación */}
                  {details.length > 1 && (
                    <Button
                      className='flex flex-col flex-auto'
                      type='button'
                      variant='ghost'
                      size='icon'
                      onClick={() => onRemoveDetail(index, detail)}>
                      <LuTrash2 className='w-4 h-4' />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            <DialogFooter className='flex flex-wrap justify-between gap-3 mt-5 md:justify-end'>
              <DialogClose asChild>
                <Button
                  type='button'
                  variant='secondary'
                  className='flex-1 md:flex-initial md:w-24'>
                  {t('cancel')}
                </Button>
              </DialogClose>
              <Button
                className='flex-1 md:flex-initial md:w-24'
                type='button'
                variant='success'
                onClick={onAddDetail}>
                {t('add_detail')}
              </Button>
              {saleId && (
                <Button
                  type='button'
                  variant='destructive'
                  className='flex-1 md:flex-initial md:w-24'
                  onClick={() => {
                    handleDelete()
                  }}>
                  {t('delete')}
                </Button>
              )}
              <Button
                type='submit'
                variant='info'
                className='flex-1 md:flex-initial md:w-24'>
                {saleId ? t('update') : t('save')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

SalesDialog.propTypes = {
  openDialog: PropTypes.bool.isRequired,
  onCloseDialog: PropTypes.func.isRequired,
  selectedRow: PropTypes.object,
  onSubmit: PropTypes.func.isRequired,
  onDeleteById: PropTypes.func.isRequired,
  actionDialog: PropTypes.string.isRequired,
  onAddDetail: PropTypes.func.isRequired,
  onRemoveDetail: PropTypes.func.isRequired,
  onEditDetail: PropTypes.func.isRequired,
  products: PropTypes.array.isRequired,
  details: PropTypes.array,
  clients: PropTypes.array.isRequired,
  setDetails: PropTypes.func
}

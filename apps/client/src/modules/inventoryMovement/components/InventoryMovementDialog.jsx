import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import PropTypes from 'prop-types'
import { useEffect } from 'react'
import { InventoryMovementSchema, MOVEMENT_TYPES } from '../utils'

export const InventoryMovementDialog = ({
  openDialog,
  onCloseDialog,
  selectedRow,
  onSubmit,
  onDeleteById,
  actionDialog,
  products,
  warehouses
}) => {
  const { t } = useTranslation()

  const form = useForm({
    resolver: zodResolver(InventoryMovementSchema),
    defaultValues: {
      productId: '',
      warehouseId: '',
      quantity: '',
      type: '',
      reason: ''
    }
  })

  useEffect(() => {
    if (selectedRow?.id) {
      const mappedValues = {
        productId: selectedRow.productId?.toString() ?? '',
        warehouseId: selectedRow.warehouseId?.toString() ?? '',
        quantity: selectedRow.quantity?.toString() ?? '',
        type: selectedRow.type ?? '',
        reason: selectedRow.reason ?? ''
      }
      form.reset(mappedValues)
    }
  }, [selectedRow, form])

  const handleSubmit = async data => {
    await onSubmit(data, selectedRow?.id)
    handleCloseDialog()
  }

  const handleCloseDialog = () => {
    form.reset()
    onCloseDialog()
  }

  const handleDelete = async () => {
    await onDeleteById(selectedRow.id)
    handleCloseDialog()
  }

  return (
    <Dialog open={openDialog} onOpenChange={handleCloseDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{actionDialog}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className='space-y-4'>
            <FormField
              control={form.control}
              name='productId'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('product')}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <option value=''>{t('select_product')}</option>
                    {products.map(product => (
                      <option key={product.id} value={product.id}>
                        {product.name}
                      </option>
                    ))}
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='warehouseId'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('warehouse')}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <option value=''>{t('select_warehouse')}</option>
                    {warehouses.map(warehouse => (
                      <option key={warehouse.id} value={warehouse.id}>
                        {warehouse.name}
                      </option>
                    ))}
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='quantity'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('quantity')}</FormLabel>
                  <FormControl>
                    <Input type='number' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='type'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('type')}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <option value=''>{t('select_type')}</option>
                    {Object.values(MOVEMENT_TYPES).map(type => (
                      <option key={type} value={type}>
                        {t(type.toLowerCase())}
                      </option>
                    ))}
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='reason'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('reason')}</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className='flex justify-end gap-4 mt-6'>
              <Button type='submit' variant='default'>
                {selectedRow?.id ? t('update') : t('add')}
              </Button>
              {selectedRow?.id && (
                <Button
                  type='button'
                  variant='destructive'
                  onClick={handleDelete}>
                  {t('delete')}
                </Button>
              )}
              <Button
                type='button'
                variant='outline'
                onClick={handleCloseDialog}>
                {t('cancel')}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

InventoryMovementDialog.propTypes = {
  openDialog: PropTypes.bool.isRequired,
  onCloseDialog: PropTypes.func.isRequired,
  selectedRow: PropTypes.object,
  onSubmit: PropTypes.func.isRequired,
  onDeleteById: PropTypes.func.isRequired,
  actionDialog: PropTypes.string.isRequired,
  products: PropTypes.array.isRequired,
  warehouses: PropTypes.array.isRequired
}

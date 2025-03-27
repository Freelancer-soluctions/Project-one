import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import PropTypes from 'prop-types'
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { InventoryMovementSchema } from '../utils/schema'

const InventoryMovementDialog = ({
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
      reason: '',
      purchaseId: '',
      saleId: ''
    }
  })

  useEffect(() => {
    if (selectedRow?.id) {
      const mappedValues = {
        productId: selectedRow.productId.toString(),
        warehouseId: selectedRow.warehouseId.toString(),
        quantity: selectedRow.quantity.toString(),
        type: selectedRow.type,
        reason: selectedRow.reason || '',
        purchaseId: selectedRow.purchaseId?.toString() || '',
        saleId: selectedRow.saleId?.toString() || ''
      }
      form.reset(mappedValues)
    } else {
      form.reset({
        productId: '',
        warehouseId: '',
        quantity: '',
        type: '',
        reason: '',
        purchaseId: '',
        saleId: ''
      })
    }
  }, [selectedRow, form])

  const handleSubmit = values => {
    onSubmit(values, selectedRow?.id)
  }

  const handleDelete = () => {
    onDeleteById(selectedRow.id)
  }

  return (
    <Dialog open={openDialog} onOpenChange={onCloseDialog}>
      <DialogContent className='sm:max-w-[425px]'>
        <DialogHeader>
          <DialogTitle>{actionDialog}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className='space-y-4'>
            <FormField
              control={form.control}
              name='productId'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('product')}</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={!!selectedRow?.id}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('select_product')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {products?.map(product => (
                        <SelectItem key={product.id} value={product.id.toString()}>
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
              name='warehouseId'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('warehouse')}</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={!!selectedRow?.id}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('select_warehouse')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {warehouses?.map(warehouse => (
                        <SelectItem key={warehouse.id} value={warehouse.id.toString()}>
                          {warehouse.name}
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
              name='quantity'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('quantity')}</FormLabel>
                  <FormControl>
                    <Input
                      type='number'
                      placeholder={t('enter_quantity')}
                      {...field}
                      disabled={!!selectedRow?.id}
                    />
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
                  <FormLabel>{t('movement_type')}</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={!!selectedRow?.id}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('select_type')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value='ENTRY'>{t('entry')}</SelectItem>
                      <SelectItem value='EXIT'>{t('exit')}</SelectItem>
                      <SelectItem value='TRANSFERENCE'>{t('transference')}</SelectItem>
                      <SelectItem value='ADJUSTMENT'>{t('adjustment')}</SelectItem>
                    </SelectContent>
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
                    <Input
                      type='text'
                      placeholder={t('enter_reason')}
                      {...field}
                      disabled={!!selectedRow?.id}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className='flex justify-end space-x-2'>
              {selectedRow?.id && (
                <Button type='button' variant='destructive' onClick={handleDelete}>
                  {t('delete')}
                </Button>
              )}
              <Button type='button' variant='outline' onClick={onCloseDialog}>
                {t('cancel')}
              </Button>
              <Button type='submit' variant='default'>
                {t('save')}
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
  selectedRow: PropTypes.shape({
    id: PropTypes.number,
    productId: PropTypes.number,
    warehouseId: PropTypes.number,
    quantity: PropTypes.number,
    type: PropTypes.string,
    reason: PropTypes.string,
    purchaseId: PropTypes.number,
    saleId: PropTypes.number
  }),
  onSubmit: PropTypes.func.isRequired,
  onDeleteById: PropTypes.func.isRequired,
  actionDialog: PropTypes.string.isRequired,
  products: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      name: PropTypes.string.isRequired
    })
  ),
  warehouses: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      name: PropTypes.string.isRequired
    })
  )
}

export default InventoryMovementDialog 
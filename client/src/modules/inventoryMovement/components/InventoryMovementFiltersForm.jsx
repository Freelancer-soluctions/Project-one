import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import PropTypes from 'prop-types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const InventoryMovementFiltersForm = ({ onSubmit, onAddDialog, products, warehouses }) => {
  const { t } = useTranslation()
  const form = useForm({
    defaultValues: {
      productId: '',
      warehouseId: '',
      type: '',
      startDate: '',
      endDate: ''
    }
  })

  const handleSubmit = data => {
    onSubmit(data)
  }

  const handleAdd = () => {
    onAddDialog()
  }

  const handleResetFilter = () => {
    form.reset()
    onSubmit({})
  }

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className='space-y-4'>
      <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4'>
        <div className='space-y-2'>
          <Label htmlFor='productId'>{t('product')}</Label>
          <Select
            value={form.watch('productId')}
            onValueChange={value => form.setValue('productId', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder={t('select_product')} />
            </SelectTrigger>
            <SelectContent>
              {products?.map(product => (
                <SelectItem key={product.id} value={product.id.toString()}>
                  {product.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className='space-y-2'>
          <Label htmlFor='warehouseId'>{t('warehouse')}</Label>
          <Select
            value={form.watch('warehouseId')}
            onValueChange={value => form.setValue('warehouseId', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder={t('select_warehouse')} />
            </SelectTrigger>
            <SelectContent>
              {warehouses?.map(warehouse => (
                <SelectItem key={warehouse.id} value={warehouse.id.toString()}>
                  {warehouse.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className='space-y-2'>
          <Label htmlFor='type'>{t('movement_type')}</Label>
          <Select
            value={form.watch('type')}
            onValueChange={value => form.setValue('type', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder={t('select_type')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='ENTRY'>{t('entry')}</SelectItem>
              <SelectItem value='EXIT'>{t('exit')}</SelectItem>
              <SelectItem value='TRANSFERENCE'>{t('transference')}</SelectItem>
              <SelectItem value='ADJUSTMENT'>{t('adjustment')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className='space-y-2'>
          <Label htmlFor='startDate'>{t('start_date')}</Label>
          <Input
            id='startDate'
            type='date'
            {...form.register('startDate')}
            className='w-full'
          />
        </div>

        <div className='space-y-2'>
          <Label htmlFor='endDate'>{t('end_date')}</Label>
          <Input
            id='endDate'
            type='date'
            {...form.register('endDate')}
            className='w-full'
          />
        </div>
      </div>

      <div className='flex justify-end space-x-2'>
        <Button type='submit' variant='default'>
          {t('search')}
        </Button>
        <Button type='button' variant='outline' onClick={handleAdd}>
          {t('add_movement')}
        </Button>
        <Button type='button' variant='destructive' onClick={handleResetFilter}>
          {t('clear_filters')}
        </Button>
      </div>
    </form>
  )
}

InventoryMovementFiltersForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  onAddDialog: PropTypes.func.isRequired,
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

export default InventoryMovementFiltersForm 
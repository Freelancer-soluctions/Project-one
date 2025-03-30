import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
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
import { MOVEMENT_TYPES } from '../utils'

 export const InventoryMovementFiltersForm = ({
  onSubmit,
  onAddDialog,
  products,
  warehouses
}) => {
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
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className='p-6 rounded-lg shadow-sm bg-card'
      >
        <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4'>
          <FormField
            control={form.control}
            name='productId'
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('product')}</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <option value=''>{t('all')}</option>
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
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <option value=''>{t('all')}</option>
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
            name='type'
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('type')}</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <option value=''>{t('all')}</option>
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
            name='startDate'
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('start_date')}</FormLabel>
                <FormControl>
                  <Input type='date' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='endDate'
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('end_date')}</FormLabel>
                <FormControl>
                  <Input type='date' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className='flex justify-end gap-4 mt-6'>
          <Button type='submit' variant='default'>
            {t('filter')}
          </Button>
          <Button type='button' variant='outline' onClick={handleResetFilter}>
            {t('clear')}
          </Button>
          <Button type='button' onClick={handleAdd}>
            {t('add')}
          </Button>
        </div>
      </form>
    </Form>
  )
}

InventoryMovementFiltersForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  onAddDialog: PropTypes.func.isRequired,
  products: PropTypes.array.isRequired,
  warehouses: PropTypes.array.isRequired
}


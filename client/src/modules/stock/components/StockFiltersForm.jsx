import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { PlusIcon } from '@heroicons/react/24/outline'

const StockFiltersForm = ({
  onSubmit,
  onAddDialog,
  unitMeasures,
  products,
  warehouses
}) => {
  const { t } = useTranslation()

  const form = useForm({
    defaultValues: {
      productId: '',
      warehouseId: '',
      lot: '',
      unitMeasure: ''
    }
  })

  return (
    <div className='p-4 border rounded-lg'>
      <div className='flex items-center justify-between pb-4'>
        <h2 className='text-lg font-semibold'>{t('filters')}</h2>
        <Button onClick={onAddDialog}>
          <PlusIcon className='w-4 h-4 mr-2' />
          {t('add')}
        </Button>
      </div>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className='grid grid-cols-1 gap-4 md:grid-cols-4'
        >
          <FormField
            control={form.control}
            name='productId'
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('product')}</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t('select_product')} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value=''>{t('all')}</SelectItem>
                    {products?.map(product => (
                      <SelectItem key={product.id} value={product.id.toString()}>
                        {product.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t('select_warehouse')} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value=''>{t('all')}</SelectItem>
                    {warehouses?.map(warehouse => (
                      <SelectItem key={warehouse.id} value={warehouse.id.toString()}>
                        {warehouse.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='lot'
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('lot')}</FormLabel>
                <FormControl>
                  <Input {...field} placeholder={t('search_by_lot')} />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='unitMeasure'
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('unit_measure')}</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t('select_unit_measure')} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value=''>{t('all')}</SelectItem>
                    {unitMeasures.map(measure => (
                      <SelectItem key={measure} value={measure}>
                        {t(measure.toLowerCase())}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />

          <Button type='submit' className='md:col-start-4'>
            {t('search')}
          </Button>
        </form>
      </Form>
    </div>
  )
}

export default StockFiltersForm 
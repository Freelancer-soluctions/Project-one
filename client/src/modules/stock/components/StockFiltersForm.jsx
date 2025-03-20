import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { LuPlus, LuSearch, LuEraser } from 'react-icons/lu'
import PropTypes from 'prop-types'

export const StockFiltersForm = ({
  onSubmit,
  onAddDialog,
  unitMeasures,
  products,
  warehouses
}) => {
  const { t } = useTranslation()

  const form = useForm({
    defaultValues: {
      productId: null,
      warehouseId: null,
      lot: '',
      unitMeasure: ''
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
  }

  return (
    <Form {...form}>
      <form
        method='post'
        action=''
        id='profile-info-form'
        noValidate
        onSubmit={form.handleSubmit(handleSubmit)}
        className='flex flex-col flex-wrap gap-5'>
        {/* inputs */}
        <div className='flex flex-wrap flex-1 gap-3'>
          <FormField
            control={form.control}
            name='productId'
            render={({ field }) => {
              return (
                <FormItem className='flex flex-col flex-auto'>
                  <FormLabel htmlFor='productId'>{t('product')}</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value?.toString()} // Asegura que el valor sea string
                  >
                    <FormControl id='productId'>
                      <SelectTrigger>
                        <SelectValue placeholder={t('select_product')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {products.map((item, index) => (
                        <SelectItem value={item.id.toString()} key={index}>
                          {item.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )
            }}
          />
          <FormField
            control={form.control}
            name='warehouseId'
            render={({ field }) => {
              return (
                <FormItem className='flex flex-col flex-auto'>
                  <FormLabel htmlFor='warehouseId'>{t('warehouse')}</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value?.toString()} // Asegura que el valor sea string
                  >
                    <FormControl id='warehouseId'>
                      <SelectTrigger>
                        <SelectValue placeholder={t('select_warehouse')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {warehouses.map((item, index) => (
                        <SelectItem value={item.id.toString()} key={index}>
                          {item.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )
            }}
          />
          <FormField
            control={form.control}
            name='lot'
            render={({ field }) => {
              return (
                <FormItem className='flex flex-col flex-auto'>
                  <FormLabel htmlFor='lot'>{t('lot')}</FormLabel>
                  <FormControl>
                    <Input
                      id='lot'
                      name='lot'
                      placeholder={t('search_by_lot')}
                      type='text'
                      autoComplete='false'
                      maxLength={50}
                      {...field}
                      value={field.value ?? ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )
            }}
          />

          <FormField
            control={form.control}
            name='unitMeasure'
            render={({ field }) => (
              <FormItem className='flex flex-col flex-auto'>
                <FormLabel>{t('unit_measure')}</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t('select_unit_measure')} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {unitMeasures.map((measure, index) => (
                      <SelectItem key={index} value={measure.value}>
                        {measure.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />
        </div>
        {/* buttons */}
        <div className='flex flex-wrap items-center justify-between gap-3 mt-5 md:justify-normal'>
          <Button
            type='submit'
            className='flex-1 md:flex-initial md:w-24'
            variant='info'>
            {t('search')}
            <LuSearch className='w-4 h-4 ml-auto opacity-50' />
          </Button>
          <Button
            type='button'
            className='flex-1 md:flex-initial md:w-24'
            variant='success'
            onClick={() => handleAdd()}>
            {t('add')} <LuPlus className='w-4 h-4 ml-auto opacity-50' />
          </Button>
          <Button
            type='button'
            className='flex-1 md:flex-initial md:w-24'
            variant='outline'
            onClick={() => handleResetFilter()}>
            {t('clear')} <LuEraser className='w-4 h-4 ml-auto opacity-50' />
          </Button>
        </div>
      </form>
    </Form>
  )
}

StockFiltersForm.propTypes = {
  onSubmit: PropTypes.func,
  onAddDialog: PropTypes.func,
  unitMeasures: PropTypes.array,
  products: PropTypes.array,
  warehouses: PropTypes.array
}

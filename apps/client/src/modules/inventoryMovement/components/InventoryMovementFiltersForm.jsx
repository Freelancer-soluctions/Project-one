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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import PropTypes from 'prop-types'
import { movementTypes } from '../utils'
import { LuCalendarDays, LuSearch, LuPlus, LuEraser } from 'react-icons/lu'
import { cn } from '@/lib/utils'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover'
import { format } from 'date-fns'

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
        method='post'
        action=''
        id='inventory-movement-form'
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
            name='type'
            render={({ field }) => {
              return (
                <FormItem className='flex flex-col flex-auto'>
                  <FormLabel htmlFor='type'>{t('type')}</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value?.toString()} // Asegura que el valor sea string
                  >
                    <FormControl id='warehouseId'>
                      <SelectTrigger>
                        <SelectValue placeholder={t('select_type')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {movementTypes.map((item, index) => (
                        <SelectItem value={item.value} key={index}>
                          {item.label}
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
            name='fdate'
            render={({ field }) => (
              <FormItem className='flex flex-col flex-auto'>
                <FormLabel htmlFor='fdate'>{t('from_date')}</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        id='fdate'
                        variant={'outline'}
                        className={cn(
                          'pl-3 text-left font-normal',
                          !field.value && 'text-muted-foreground'
                        )}>
                        {field.value ? (
                          format(field.value, 'PPP')
                        ) : (
                          <span>{t('pick_date')}</span>
                        )}
                        <LuCalendarDays className='w-4 h-4 ml-auto opacity-50' />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className='w-auto p-0' align='start'>
                    <Calendar
                      mode='single'
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={date => date < new Date('1900-01-01')}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='tdate'
            render={({ field }) => (
              <FormItem className='flex flex-col flex-auto'>
                <FormLabel htmlFor='tdate'>{t('to_date')}</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        id='tdate'
                        variant={'outline'}
                        className={cn(
                          'pl-3 text-left font-normal',
                          !field.value && 'text-muted-foreground'
                        )}>
                        {field.value ? (
                          format(field.value, 'PPP')
                        ) : (
                          <span>{t('pick_date')}</span>
                        )}
                        <LuCalendarDays className='w-4 h-4 ml-auto opacity-50' />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className='w-auto p-0' align='start'>
                    <Calendar
                      mode='single'
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={date => date < new Date('1900-01-01')}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
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
            onClick={handleAdd}>
            {t('add')} <LuPlus className='w-4 h-4 ml-auto opacity-50' />
          </Button>
          <Button
            type='button'
            className='flex-1 md:flex-initial md:w-24'
            variant='outline'
            onClick={handleResetFilter}>
            {t('clear')} <LuEraser className='w-4 h-4 ml-auto opacity-50' />
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

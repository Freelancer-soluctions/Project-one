import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { zodResolver } from '@hookform/resolvers/zod'
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { LuPlus, LuSearch, LuEraser, LuCalendarDays } from 'react-icons/lu'
import PropTypes from 'prop-types'
import { Calendar } from '@/components/ui/calendar'
import { format, formatISO } from 'date-fns'
import { cn } from '@/lib/utils'
import { PurchaseFiltersSchema } from '../utils'

export const PurchaseFiltersForm = ({ onSubmit, onAddDialog, providers }) => {
  const { t } = useTranslation()

  const form = useForm({
    resolver: zodResolver(PurchaseFiltersSchema),
    defaultValues: {
      providerId: '',
      fromDate: '',
      toDate: '',
      minTotal: '',
      maxTotal: ''
    }
  })

  const handleSubmit = ({
    providerId,
    fromDate,
    toDate,
    minTotal,
    maxTotal
  }) => {
    const fDate = fromDate && formatISO(new Date(fromDate), 'yyyy-MM-dd')
    const tDate = toDate && formatISO(new Date(toDate), 'yyyy-MM-dd')

    onSubmit({ providerId, fDate, tDate, minTotal, maxTotal })
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
        id='purchase-filters-form'
        noValidate
        onSubmit={form.handleSubmit(handleSubmit)}
        className='flex flex-col flex-wrap gap-5'>
        {/* inputs */}
        <div className='flex flex-wrap flex-1 gap-3'>
          <FormField
            control={form.control}
            name='providerId'
            render={({ field }) => (
              <FormItem className='flex flex-col flex-auto'>
                <FormLabel>{t('provider')}</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t('select_provider')} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {providers?.map(provider => (
                      <SelectItem
                        key={provider.id}
                        value={provider.id.toString()}>
                        {provider.name}
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
            name='fromDate'
            render={({ field }) => (
              <FormItem className='flex flex-col flex-auto'>
                <FormLabel htmlFor='fromDate'>{t('from_date')}</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        id='fromDate'
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
            name='toDate'
            render={({ field }) => (
              <FormItem className='flex flex-col flex-auto'>
                <FormLabel htmlFor='toDate'>{t('to_date')}</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        id='toDate'
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
            name='minTotal'
            render={({ field }) => {
              return (
                <FormItem className='flex flex-col flex-auto'>
                  <FormLabel htmlFor='minTotal'>{t('min_total')}</FormLabel>
                  <FormControl>
                    <Input
                      id='minTotal'
                      name='minTotal'
                      type='number'
                      step='0.01'
                      min='0'
                      placeholder={t('min_total_placeholder')}
                      autoComplete='off'
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
            name='maxTotal'
            render={({ field }) => {
              return (
                <FormItem className='flex flex-col flex-auto'>
                  <FormLabel htmlFor='maxTotal'>{t('max_total')}</FormLabel>
                  <FormControl>
                    <Input
                      id='maxTotal'
                      name='maxTotal'
                      type='number'
                      step='0.01'
                      min='0'
                      placeholder={t('max_total_placeholder')}
                      autoComplete='off'
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
            onClick={() => handleResetFilter()}>
            {t('clear')} <LuEraser className='w-4 h-4 ml-auto opacity-50' />
          </Button>
        </div>
      </form>
    </Form>
  )
}

PurchaseFiltersForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  onAddDialog: PropTypes.func.isRequired,
  providers: PropTypes.array.isRequired
}

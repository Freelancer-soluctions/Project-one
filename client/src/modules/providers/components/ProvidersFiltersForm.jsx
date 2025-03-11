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
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { LuPlus, LuCalendarDays, LuSearch, LuEraser } from 'react-icons/lu'
import { IoMdAdd } from 'react-icons/io'

import { Calendar } from '@/components/ui/calendar'
import { format, formatISO } from 'date-fns'
import { cn } from '@/lib/utils'
import PropTypes from 'prop-types'

export const ProvidersFiltersForm = ({
  onSubmit,
  dataStatus,
  isLoadingStatus,
  isFetchingStatus
}) => {
  const { t } = useTranslation()
  const form = useForm({
    defaultValues: {
      description: '',
      fromDate: '',
      toDate: '',
      statusProviders: ''
    }
  })

  const handleSubmit = data => {
    const formattedData = {
      description: data.description,
      fromDate: data.fromDate ? format(data.fromDate, 'yyyy-MM-dd') : '',
      toDate: data.toDate ? format(data.toDate, 'yyyy-MM-dd') : '',
      statusProviders: data.statusCode
    }
    onSubmit(formattedData)
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className='space-y-8 mb-4'
      >
        <div className='grid grid-cols-1 gap-4 md:grid-cols-5'>
          <FormField
            control={form.control}
            name='description'
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('description')}</FormLabel>
                <FormControl>
                  <Input placeholder={t('description')} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='fromDate'
            render={({ field }) => (
              <FormItem className='flex flex-col'>
                <FormLabel>{t('from_date')}</FormLabel>
                <DatePicker
                  placeholder={t('pick_date')}
                  onChange={field.onChange}
                  date={field.value}
                />
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='toDate'
            render={({ field }) => (
              <FormItem className='flex flex-col'>
                <FormLabel>{t('to_date')}</FormLabel>
                <DatePicker
                  placeholder={t('pick_date')}
                  onChange={field.onChange}
                  date={field.value}
                />
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='statusProviders'
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('status')}</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={isLoadingStatus || isFetchingStatus}
                >
                  <FormControl>
                    <SelectTrigger
                      className={cn(
                        'w-full',
                        !field.value && 'text-muted-foreground'
                      )}
                    >
                      <SelectValue
                        placeholder={t('select_status')}
                        className='w-full'
                      />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {dataStatus?.data.map(item => (
                      <SelectItem key={item.id} value={item.code}>
                        {item.description}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className='flex items-end gap-2'>
            <Button type='submit' className='w-full md:w-auto'>
              <LuSearch className='mr-2 h-4 w-4' />
              {t('search')}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  )
}

ProvidersFiltersForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  dataStatus: PropTypes.object,
  isLoadingStatus: PropTypes.bool,
  isFetchingStatus: PropTypes.bool
}

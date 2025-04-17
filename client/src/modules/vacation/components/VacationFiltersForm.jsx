import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import PropTypes from 'prop-types'

import { useGetAllEmployeesQuery } from '@/modules/employees/api/employeesApi' // Import employee query

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
import { Calendar } from '@/components/ui/calendar'
import { Button } from '@/components/ui/button'
import { CalendarIcon } from '@radix-ui/react-icons'
import { LuPlus, LuSearch, LuEraser } from 'react-icons/lu'

const VACATION_STATUS = ['PENDING', 'APPROVED', 'REJECTED']

export const VacationFiltersForm = ({ onSubmit, onAddDialog }) => {
  const { t } = useTranslation()

  // Fetch employees
  const { data: employeesData, isLoading: isLoadingEmployees } = useGetAllEmployeesQuery()
  const employeesList = employeesData?.data || []

  const form = useForm({
    defaultValues: {
      employeeId: '',
      status: '', // Add status filter
      fromDate: null,
      toDate: null
    }
  })

  const handleSubmit = data => {
    const filters = {
      employeeId: data.employeeId || undefined,
      status: data.status || undefined, // Include status
      fromDate: data.fromDate ? format(data.fromDate, 'yyyy-MM-dd') : undefined,
      toDate: data.toDate ? format(data.toDate, 'yyyy-MM-dd') : undefined
    }
    Object.keys(filters).forEach(key => filters[key] === undefined && delete filters[key])
    onSubmit(filters)
  }

  const handleAdd = () => {
    onAddDialog()
  }

  const handleResetFilter = () => {
    form.reset({
      employeeId: '',
      status: '',
      fromDate: null,
      toDate: null
    })
    onSubmit({}) // Submit empty filters to reset
  }

  return (
    <Form {...form}>
      <form
        method='get'
        action=''
        id='vacation-filters-form'
        noValidate
        onSubmit={form.handleSubmit(handleSubmit)}
        className='flex flex-col flex-wrap gap-5'>
        {/* inputs */}
        <div className='grid grid-cols-1 gap-3 md:grid-cols-4'> {/* Adjusted grid for 4 filters */}
          {/* Employee Select Filter */}
          <FormField
            control={form.control}
            name='employeeId'
            render={({ field }) => (
              <FormItem className='flex flex-col flex-auto'>
                <FormLabel>{t('employee')}</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value?.toString() ?? ''}
                  disabled={isLoadingEmployees}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t('select_employee_placeholder')} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="">{t('all_employees')}</SelectItem>
                    {employeesList.map(employee => (
                      <SelectItem key={employee.id} value={employee.id.toString()}>
                        {`${employee.name} ${employee.lastName}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Status Select Filter */}
           <FormField
                control={form.control}
                name='status'
                render={({ field }) => (
                  <FormItem className='flex flex-col flex-auto'>
                    <FormLabel>{t('status')}</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value ?? ''} // Allow empty selection for 'all'
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('select_status_placeholder')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                         <SelectItem value="">{t('all_statuses')}</SelectItem> {/* Option for all */}
                        {VACATION_STATUS.map(status => (
                          <SelectItem key={status} value={status}>
                            {t(`status.${status}`)} {/* Assumes translations like status.PENDING */}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

          {/* From Date Filter */}
          <FormField
            control={form.control}
            name="fromDate"
            render={({ field }) => (
              <FormItem className="flex flex-col flex-auto">
                <FormLabel>{t('from_date')}</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>{t('pick_a_date')}</span>
                        )}
                        <CalendarIcon className="w-4 h-4 ml-auto opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* To Date Filter */}
          <FormField
            control={form.control}
            name="toDate"
            render={({ field }) => (
              <FormItem className="flex flex-col flex-auto">
                <FormLabel>{t('to_date')}</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>{t('pick_a_date')}</span>
                        )}
                        <CalendarIcon className="w-4 h-4 ml-auto opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) =>
                        date > new Date() || date < new Date("1900-01-01") || (form.getValues('fromDate') && date < form.getValues('fromDate'))
                      }
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

VacationFiltersForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  onAddDialog: PropTypes.func
} 
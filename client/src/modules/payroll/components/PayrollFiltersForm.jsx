import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import PropTypes from 'prop-types'

import { useGetAllEmployeesQuery } from '@/modules/employees/api/employeesApi' // Assuming employee API exists

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
import { Input } from '@/components/ui/input' // Using Input for Year filter
import { Button } from '@/components/ui/button'
import { LuPlus, LuSearch, LuEraser } from 'react-icons/lu'

export const PayrollFiltersForm = ({ onSubmit, onAddDialog }) => {
  const { t } = useTranslation()

  // Fetch employees for the filter dropdown
  const { data: employeesData, isLoading: isLoadingEmployees } = useGetAllEmployeesQuery()
  const employeesList = employeesData?.data || []

  const form = useForm({
    defaultValues: {
      employeeId: '',
      month: '', // Use string for Select
      year: '' // Use string for Input
    }
  })

  // Generate month and year options for filters
  const currentYear = new Date().getFullYear()
  const months = Array.from({ length: 12 }, (_, i) => ({
    value: (i + 1).toString(),
    label: t(`months.${i + 1}`) // Ensure you have these translations
  }))
  // const years = Array.from({ length: 10 }, (_, i) => ({ value: (currentYear - 5 + i).toString() })); // If using Select for year

  const handleSubmit = data => {
    const filters = {
      employeeId: data.employeeId || undefined,
      month: data.month ? Number(data.month) : undefined,
      year: data.year ? Number(data.year) : undefined
    }
    // Remove undefined filters before submitting
    Object.keys(filters).forEach(key => filters[key] === undefined && delete filters[key])
    onSubmit(filters)
  }

  const handleAdd = () => {
    onAddDialog()
  }

  const handleResetFilter = () => {
    form.reset({
      employeeId: '',
      month: '',
      year: ''
    })
    onSubmit({}) // Submit empty filters to reset
  }

  return (
    <Form {...form}>
      <form
        method='get' // Use GET for filtering
        action=''
        id='payroll-filters-form'
        noValidate
        onSubmit={form.handleSubmit(handleSubmit)}
        className='flex flex-col flex-wrap gap-5'>
        {/* inputs */}
        <div className='flex flex-wrap flex-1 gap-3'>
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
                    <SelectItem value="">{t('all_employees')}</SelectItem> {/* Option for all */}
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

          {/* Month Select Filter */}
          <FormField
            control={form.control}
            name='month'
            render={({ field }) => (
              <FormItem className='flex flex-col flex-auto'>
                <FormLabel>{t('month')}</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value?.toString() ?? ''}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t('select_month_placeholder')} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                     <SelectItem value="">{t('all_months')}</SelectItem> {/* Option for all */}
                    {months.map(month => (
                      <SelectItem key={month.value} value={month.value}>
                        {month.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Year Input Filter */}
          <FormField
            control={form.control}
            name="year"
            render={({ field }) => (
              <FormItem className="flex flex-col flex-auto">
                <FormLabel htmlFor='year'>{t('year')}</FormLabel>
                <FormControl>
                  <Input
                    id="year"
                    name="year"
                    placeholder={t('year_placeholder')}
                    type="number"
                    min="2000"
                    {...field}
                    value={field.value ?? ''}
                  />
                </FormControl>
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

PayrollFiltersForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  onAddDialog: PropTypes.func
} 
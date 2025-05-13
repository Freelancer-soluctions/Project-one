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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select' // Added for status filter
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { LuPlus, LuSearch, LuEraser } from 'react-icons/lu'
import PropTypes from 'prop-types'
import { ExpensesFiltersSchema } from '../utils' // Changed from ClientsFiltersSchema
import { zodResolver } from '@hookform/resolvers/zod'

// Define expense categories based on prisma schema for the Select component (same as in Dialog)
const expenseCategories = [
  { value: 'RENTAL', labelKey: 'expense_category_rental' },
  { value: 'UTILITIES', labelKey: 'expense_category_utilities' },
  { value: 'SALARIES', labelKey: 'expense_category_salaries' },
  { value: 'SUPPLIES', labelKey: 'expense_category_supplies' },
  { value: 'TRANSPORT', labelKey: 'expense_category_transport' },
  { value: 'MAINTENANCE', labelKey: 'expense_category_maintenance' },
  { value: 'MARKETING', labelKey: 'expense_category_marketing' },
  { value: 'SOFTWARE', labelKey: 'expense_category_software' },
  { value: 'PROFESSIONAL_SERVICES', labelKey: 'expense_category_professional_services' },
  { value: 'TAXES', labelKey: 'expense_category_taxes' },
  { value: 'BANK_FEES', labelKey: 'expense_category_bank_fees' },
  { value: 'TRAVEL', labelKey: 'expense_category_travel' },
  { value: 'TRAINING', labelKey: 'expense_category_training' },
  { value: 'OTHER', labelKey: 'expense_category_other' }
];

export const ExpensesFiltersForm = ({ onSubmit, onAddDialog }) => { // Renamed
  const { t } = useTranslation()
  const form = useForm({
    resolver: zodResolver(ExpensesFiltersSchema), // Changed schema
    defaultValues: { // Added default values for new filter fields
      description: '',
      category: '',
      status: ''
    }
  })

  const handleSubmit = data => {
    // Filter out empty strings before submitting, so undefined is sent for empty filters
    const filteredData = Object.entries(data).reduce((acc, [key, value]) => {
      if (value !== '') {
        acc[key] = value;
      }
      return acc;
    }, {});
    onSubmit(filteredData)
  }

  const handleAdd = () => {
    onAddDialog()
  }

  const handleResetFilter = () => {
    form.reset({ // Reset to defined defaults
        description: '',
        category: '',
        status: ''
    })
    onSubmit({}); // Submit empty object to clear filters in parent
  }

  return (
    <Form {...form}>
      <form
        method='post'
        action=''
        id='expense-filters-form' // Changed id
        noValidate
        onSubmit={form.handleSubmit(handleSubmit)}
        className='flex flex-col flex-wrap gap-5'>
        {/* inputs */}
        <div className='grid grid-cols-1 gap-4 md:grid-cols-3'> {/* Using grid for better layout */}
          <FormField
            control={form.control}
            name='description'
            render={({ field }) => (
              <FormItem>
                <FormLabel htmlFor='description_filter'>{t('description')}</FormLabel> {/* Changed htmlFor and translation key */}
                <FormControl>
                  <Input
                    id='description_filter' // Changed id
                    name='description'
                    placeholder={t('filter_by_description_placeholder')} // Changed placeholder
                    type='text'
                    autoComplete='off'
                    maxLength={100} // Example max length
                    {...field}
                    value={field.value ?? ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='category'
            render={({ field }) => (
              <FormItem>
                <FormLabel htmlFor='category_filter'>{t('category')}</FormLabel> {/* Changed htmlFor and translation key */}
                <FormControl>
                  <Input
                    id='category_filter' // Changed id
                    name='category'
                    placeholder={t('filter_by_category_placeholder')} // Changed placeholder
                    type='text'
                    autoComplete='off'
                    maxLength={100} // Example max length
                    {...field}
                    value={field.value ?? ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='status' // This is the 'expenseCategory' enum field
            render={({ field }) => (
              <FormItem>
                <FormLabel htmlFor='status_filter'>{t('status')}</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value ?? ''}>
                  <FormControl>
                    <SelectTrigger id='status_filter'>
                      <SelectValue placeholder={t('filter_by_status_placeholder')} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value=''>{t('all_statuses')}</SelectItem> {/* Option to select all */}
                    {expenseCategories.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {t(cat.labelKey)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
            onClick={handleResetFilter}> {/* Changed to call the new reset function */}
            {t('clear')} <LuEraser className='w-4 h-4 ml-auto opacity-50' />
          </Button>
        </div>
      </form>
    </Form>
  )
}

ExpensesFiltersForm.propTypes = { // Renamed
  onSubmit: PropTypes.func.isRequired,
  onAddDialog: PropTypes.func
}
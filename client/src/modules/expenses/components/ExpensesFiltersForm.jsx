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
import { ExpensesFiltersSchema, expenseCategories } from '../utils' // Changed from ClientsFiltersSchema
import { zodResolver } from '@hookform/resolvers/zod'


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
    onSubmit(data)
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
        id='expense-filters-form' 
        noValidate
        onSubmit={form.handleSubmit(handleSubmit)}
        className='flex flex-col flex-wrap gap-5'>
        {/* inputs */}
        <div className='grid grid-cols-1 gap-4 md:grid-cols-3'> 
          <FormField
            control={form.control}
            name='description'
            render={({ field }) => (
              <FormItem>
                <FormLabel htmlFor='description'>{t('description')}</FormLabel> 
                <FormControl>
                  <Input
                    id='description' 
                    name='description'
                    placeholder={t('description_placeholder')} 
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
                <FormLabel htmlFor='category'>{t('category')}</FormLabel>
                <Select onValueChange={field.onChange}  value={field.value}>
                  <FormControl>
                    <SelectTrigger id='category'>
                      <SelectValue placeholder={t('select_category')} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
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
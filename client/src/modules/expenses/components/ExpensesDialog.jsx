import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog'
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
} from '@/components/ui/select' // Added for status field
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { CalendarIcon } from '@radix-ui/react-icons'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { LuTrendingDown } from 'react-icons/lu' // Changed icon
import PropTypes from 'prop-types'
import { ExpenseSchema } from '../utils' // Changed from ClientSchema
// import { ExpenseSchema } from '../utils/ExpenseSchema'; // Alternative if not exporting from index.js

// Define expense categories based on prisma schema for the Select component
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

export const ExpensesDialog = ({ // Renamed from ClientsDialog
  openDialog,
  onCloseDialog,
  selectedRow,
  onSubmit,
  onDeleteById,
  actionDialog
}) => {
  const { t } = useTranslation()
  const [expenseId, setExpenseId] = useState('') // Renamed from clientId

  const form = useForm({
    resolver: zodResolver(ExpenseSchema), // Changed from ClientSchema
    defaultValues: {
      description: '',
      total: '', // Or 0 if it's a number treated by schema
      category: '',
      status: '', // Default value for select
      createdOn: '',
      updatedOn: '',
      userExpenseCreatedName: '', // Assuming similar field naming for user who created
      userExpenseUpdatedName: ''  // Assuming similar field naming for user who updated
    }
  })

  // Actualiza todos los valores del formulario al cambiar `selectedRow`
  useEffect(() => {
    if (selectedRow?.id) {
      const mappedValues = {
        id: selectedRow.id,
        description: selectedRow.description,
        total: selectedRow.total,
        category: selectedRow.category,
        status: selectedRow.status, // This is the enum value from DB
        createdOn: selectedRow.createdOn,
        updatedOn: selectedRow.updatedOn,
        // Adapt these if the related user data comes differently for expenses
        userExpenseCreatedName: selectedRow.userExpenseCreated?.name || selectedRow.userExpenseCreatedName || '',
        userExpenseUpdatedName: selectedRow.userExpenseUpdated?.name || selectedRow.userExpenseUpdatedName || ''
      }
      form.reset(mappedValues)
      setExpenseId(mappedValues.id)
    } else if (!openDialog) { // Changed logic to reset only if not openDialog and no selectedRow
      form.reset({
        description: '',
        total: '',
        category: '',
        status: '',
        createdOn: '',
        updatedOn: '',
        userExpenseCreatedName: '',
        userExpenseUpdatedName: ''
      })
      setExpenseId(null)
    }
  }, [selectedRow, openDialog, form]) // Added form to dependency array as per react-hook-form's recommendation

  const handleSubmit = data => {
    // Ensure total is a number if it's coming as string from input
    const dataToSubmit = {
      ...data,
      total: parseFloat(data.total) || 0,
    };
    onSubmit(dataToSubmit, expenseId)
  }

  const handleDelete = () => {
    onDeleteById(selectedRow.id)
  }

  return (
    <Dialog open={openDialog} onOpenChange={onCloseDialog}>
      <DialogContent className='sm:max-w-[600px]'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <LuTrendingDown className='inline mr-3 w-7 h-7' /> {/* Changed icon */}
            {actionDialog}
          </DialogTitle>
          <DialogDescription>
            {expenseId ? t('edit_expense_message') : t('add_expense_message')} {/* Adapted messages */}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            method='post'
            action=''
            id='expense-form' // Changed id
            noValidate
            onSubmit={form.handleSubmit(handleSubmit)}
            className='flex flex-col flex-wrap gap-5'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6 py-4 auto-rows-auto'> {/* Adjusted grid for potentially more fields or better layout */}
              <FormField
                control={form.control}
                name='description'
                render={({ field }) => (
                  <FormItem className="md:col-span-2"> {/* Spanning two columns for description */}
                    <FormLabel htmlFor='description'>{t('description')}*</FormLabel>
                    <FormControl>
                      <Input
                        id='description'
                        name='description'
                        placeholder={t('expense_description_placeholder')}
                        type='text'
                        autoComplete='off'
                        maxLength={255} // Assuming a max length
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
                name='total'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor='total'>{t('total')}*</FormLabel>
                    <FormControl>
                      <Input
                        id='total'
                        name='total'
                        placeholder={t('expense_total_placeholder')}
                        type='number' // Changed to number
                        step="0.01" // For float values
                        autoComplete='off'
                        {...field}
                        value={field.value ?? ''}
                        onChange={e => field.onChange(parseFloat(e.target.value) || '')} // Ensure value is number
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
                    <FormLabel htmlFor='category'>{t('category')}*</FormLabel>
                    <FormControl>
                      <Input
                        id='category'
                        name='category'
                        placeholder={t('expense_category_placeholder')}
                        type='text'
                        autoComplete='off'
                        maxLength={100} // Assuming a max length
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
                    <FormLabel htmlFor='status'>{t('status')}*</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                      <FormControl>
                        <SelectTrigger id='status'>
                          <SelectValue placeholder={t('select_expense_status_placeholder')} />
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

              {/* Fields for createdOn, updatedOn, etc. - adapting from ClientsDialog */}
              {selectedRow?.createdOn && expenseId && (
                <>
                  <FormField
                    control={form.control}
                    name='userExpenseCreatedName' // Adapted name
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel htmlFor='userExpenseCreatedName'>
                          {t('created_by')}
                        </FormLabel>
                        <FormControl>
                          <Input
                            id='userExpenseCreatedName'
                            name='userExpenseCreatedName'
                            disabled
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
                    name='createdOn'
                    render={({ field }) => (
                      <FormItem className='flex flex-col flex-auto'>
                        <FormLabel htmlFor='createdOn'>
                          {t('created_on')}
                        </FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                id='createdOn'
                                disabled={true}
                                variant={'outline'}
                                className={cn(
                                  'pl-3 text-left font-normal',
                                  !field.value && 'text-muted-foreground'
                                )}>
                                {field.value ? format(new Date(field.value), 'PPP') : <span>{t('select_date')}</span>}
                                <CalendarIcon className='w-4 h-4 ml-auto opacity-50' />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className='w-auto p-0' align='start'>
                            <Calendar
                              mode='single'
                              selected={field.value ? new Date(field.value) : null}
                              onSelect={field.onChange}
                              disabled={true} // Dates are usually not editable here
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}
              {selectedRow?.updatedOn && expenseId && (
                <>
                  <FormField
                    control={form.control}
                    name='userExpenseUpdatedName' // Adapted name
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel htmlFor='userExpenseUpdatedName'>
                          {t('updated_by')}
                        </FormLabel>
                        <FormControl>
                          <Input
                            id='userExpenseUpdatedName'
                            name='userExpenseUpdatedName'
                            disabled
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
                    name='updatedOn'
                    render={({ field }) => (
                      <FormItem className='flex flex-col flex-auto'>
                        <FormLabel htmlFor='updatedOn'>
                          {t('updated_on')}
                        </FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                id='updatedOn'
                                disabled={true}
                                variant={'outline'}
                                className={cn(
                                  'pl-3 text-left font-normal',
                                  !field.value && 'text-muted-foreground'
                                )}>
                                {field.value ? format(new Date(field.value), 'PPP') : <span>{t('select_date')}</span>}
                                <CalendarIcon className='w-4 h-4 ml-auto opacity-50' />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className='w-auto p-0' align='start'>
                            <Calendar
                              mode='single'
                              selected={field.value ? new Date(field.value) : null}
                              onSelect={field.onChange}
                              disabled={true} // Dates are usually not editable here
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button
                  type='button'
                  variant='secondary'
                  className='flex-1 md:flex-initial md:w-24'>
                  {t('cancel')}
                </Button>
              </DialogClose>

              {expenseId && (
                <Button
                  type='button'
                  variant='destructive'
                  className='flex-1 md:flex-initial md:w-24'
                  onClick={handleDelete}>
                  {t('delete')}
                </Button>
              )}
              <Button
                type='submit'
                variant='info'
                className='flex-1 md:flex-initial md:w-24'>
                {expenseId ? t('update') : t('save')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

ExpensesDialog.propTypes = { // Renamed from ClientsDialog
  openDialog: PropTypes.bool.isRequired,
  onCloseDialog: PropTypes.func.isRequired,
  selectedRow: PropTypes.object,
  onSubmit: PropTypes.func.isRequired,
  onDeleteById: PropTypes.func.isRequired,
  actionDialog: PropTypes.string.isRequired
}
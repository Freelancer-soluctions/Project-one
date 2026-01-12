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
import { Textarea } from '@/components/ui/textarea'

import { Calendar } from '@/components/ui/calendar'
import { CalendarIcon } from '@radix-ui/react-icons'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { LuTrendingDown } from 'react-icons/lu' // Changed icon
import PropTypes from 'prop-types'
import { ExpenseSchema, expenseCategories } from '../utils'

export const ExpensesDialog = ({
  // Renamed from ClientsDialog
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
      category: ''
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
        createdOn: selectedRow.createdOn,
        updatedOn: selectedRow.updatedOn,
        // Adapt these if the related user data comes differently for expenses
        userExpenseCreatedName:
          selectedRow.userExpenseCreated?.name ||
          selectedRow.userExpenseCreatedName ||
          '',
        userExpenseUpdatedName:
          selectedRow.userExpenseUpdated?.name ||
          selectedRow.userExpenseUpdatedName ||
          ''
      }
      form.reset(mappedValues)
      setExpenseId(mappedValues.id)
    } else if (!openDialog) {
      // Changed logic to reset only if not openDialog and no selectedRow
      form.reset({
        description: '',
        total: '',
        category: ''
      })
      setExpenseId(null)
    }
  }, [selectedRow, openDialog, form]) // Added form to dependency array as per react-hook-form's recommendation

  const handleSubmit = data => {
    // Ensure total is a number if it's coming as string from input
    const dataToSubmit = {
      ...data,
      total: parseFloat(data.total) || 0
    }
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
            <LuTrendingDown className='inline mr-3 w-7 h-7' />{' '}
            {/* Changed icon */}
            {actionDialog}
          </DialogTitle>
          <DialogDescription>
            {expenseId ? t('edit_expense_message') : t('add_expense_message')}{' '}
            {/* Adapted messages */}
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
            <div className='grid grid-cols-1 gap-6 py-4 md:grid-cols-2 auto-rows-auto'>
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
                        placeholder={t('total_placeholder')}
                        type='number' // Changed to number
                        step='0.01' // For float values
                        autoComplete='off'
                        {...field}
                        value={field.value ?? ''}
                        onChange={e =>
                          field.onChange(parseFloat(e.target.value) || '')
                        } // Ensure value is number
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
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}>
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

              <FormField
                control={form.control}
                name='description'
                render={({ field }) => {
                  return (
                    <FormItem className='flex flex-col flex-auto col-span-2'>
                      <FormLabel htmlFor='description'>
                        {t('description')}*
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          type='textarea'
                          id='description'
                          placeholder={t('description_placeholder')}
                          className='resize-none'
                          maxLength={255}
                          {...field}
                          value={field.value ?? ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )
                }}
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
                                {field.value ? (
                                  format(new Date(field.value), 'PPP')
                                ) : (
                                  <span>{t('select_date')}</span>
                                )}
                                <CalendarIcon className='w-4 h-4 ml-auto opacity-50' />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className='w-auto p-0' align='start'>
                            <Calendar
                              mode='single'
                              selected={
                                field.value ? new Date(field.value) : null
                              }
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
                                {field.value ? (
                                  format(new Date(field.value), 'PPP')
                                ) : (
                                  <span>{t('select_date')}</span>
                                )}
                                <CalendarIcon className='w-4 h-4 ml-auto opacity-50' />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className='w-auto p-0' align='start'>
                            <Calendar
                              mode='single'
                              selected={
                                field.value ? new Date(field.value) : null
                              }
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

ExpensesDialog.propTypes = {
  // Renamed from ClientsDialog
  openDialog: PropTypes.bool.isRequired,
  onCloseDialog: PropTypes.func.isRequired,
  selectedRow: PropTypes.object,
  onSubmit: PropTypes.func.isRequired,
  onDeleteById: PropTypes.func.isRequired,
  actionDialog: PropTypes.string.isRequired
}

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { zodResolver } from '@hookform/resolvers/zod'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import PropTypes from 'prop-types'

import { PayrollSchema, months } from '../utils' // Import payroll schema

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
} from '@/components/ui/select'
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar' // Keep for potential date fields if needed later
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { CalendarIcon } from '@radix-ui/react-icons' // Using FileTextIcon for payroll
import { LuFile } from 'react-icons/lu'

export const PayrollDialog = ({
  openDialog,
  onCloseDialog,
  selectedRow,
  onSubmit,
  onDeleteById,
  actionDialog,
  dataEmployees
}) => {
  const { t } = useTranslation()
  const [payrollId, setPayrollId] = useState('')

  const form = useForm({
    resolver: zodResolver(PayrollSchema),
    defaultValues: {
      employeeId: '',
      month: '', // Use string for Select component
      year: '', // Use string for Select component or Input type=number
      baseSalary: '',
      extraHours: '0',
      deductions: '0',
      totalPayment: ''
    }
  })

  // // Generate month and year options
  // const currentYear = new Date().getFullYear()
  // const years = Array.from({ length: 10 }, (_, i) => ({
  //   value: (currentYear - 5 + i).toString()
  // })) // e.g., last 5 years and next 4 years

  useEffect(() => {
    if (selectedRow?.id) {
      const mappedValues = {
        id: selectedRow.id,
        employeeId: selectedRow.employeeId,
        month: selectedRow.month?.toString(), // Ensure string for Select
        year: selectedRow.year?.toString(), // Ensure string for Select/Input
        baseSalary: selectedRow.baseSalary,
        extraHours: selectedRow.extraHours ?? '0', // Handle null/undefined
        deductions: selectedRow.deductions ?? '0', // Handle null/undefined
        totalPayment: selectedRow.totalPayment,
        createdOn: selectedRow.createdOn,
        updatedOn: selectedRow.updatedOn,
        userPayrollCreatedName: selectedRow.userPayrollCreatedName,
        userPayrollUpdatedName: selectedRow.userPayrollUpdatedName
      }
      form.reset(mappedValues)
      setPayrollId(mappedValues.id)
    } else {
      form.reset({
        employeeId: '',
        month: '',
        year: '',
        baseSalary: '',
        extraHours: '0',
        deductions: '0',
        totalPayment: ''
      })
      setPayrollId(null)
    }
  }, [selectedRow, openDialog, form])

  const handleSubmit = data => {
    // Convert numeric fields back to numbers before submitting
    const submissionData = {
      ...data,
      month: Number(data.month),
      year: Number(data.year),
      baseSalary: Number(data.baseSalary),
      extraHours: Number(data.extraHours),
      deductions: Number(data.deductions),
      totalPayment: Number(data.totalPayment)
    }
    onSubmit(submissionData, payrollId)
  }

  const handleDelete = () => {
    if (selectedRow?.id) {
      onDeleteById(selectedRow.id)
    }
  }

  return (
    <Dialog
      open={openDialog}
      onOpenChange={isOpen => {
        if (isOpen === true) return
        onCloseDialog()
      }}>
      <DialogContent className='sm:max-w-[600px]'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <LuFile className='inline mr-3 w-7 h-7' />
            {actionDialog}
          </DialogTitle>
          <DialogDescription>
            {payrollId ? t('edit_message') : t('add_message')}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            method='post'
            action=''
            id='payroll-form'
            noValidate
            onSubmit={form.handleSubmit(handleSubmit)}
            className='flex flex-col flex-wrap gap-5'>
            <div className='grid grid-cols-2 gap-6 py-4 auto-rows-auto'>
              {/* Employee Select */}
              <FormField
                control={form.control}
                name='employeeId'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('employee')}*</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value?.toString() ?? ''}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={t('select_employee_placeholder')}
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {dataEmployees.map(employee => (
                          <SelectItem
                            key={employee.id}
                            value={employee.id.toString()}>
                            {`${employee.name} ${employee.lastName}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Month Select */}
              <FormField
                control={form.control}
                name='month'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('month')}*</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value?.toString() ?? ''}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={t('select_month_placeholder')}
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
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

              {/* Year Input/Select - Using Input for simplicity */}
              <FormField
                control={form.control}
                name='year'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('year')}*</FormLabel>
                    <Input
                      id='year'
                      name='year'
                      placeholder={t('year_placeholder')}
                      type='number'
                      min='2000'
                      {...field}
                      value={field.value ?? ''}
                    />

                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Base Salary */}
              <FormField
                control={form.control}
                name='baseSalary'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor='baseSalary'>
                      {t('base_salary')}*
                    </FormLabel>
                    <FormControl>
                      <Input
                        id='baseSalary'
                        name='baseSalary'
                        placeholder={t('base_salary_placeholder')}
                        type='number'
                        step='0.01'
                        min='0'
                        {...field}
                        value={field.value ?? ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Extra Hours */}
              <FormField
                control={form.control}
                name='extraHours'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor='extraHours'>
                      {t('extra_hours')}
                    </FormLabel>
                    <FormControl>
                      <Input
                        id='extraHours'
                        name='extraHours'
                        placeholder={t('extra_hours_placeholder')}
                        type='number'
                        step='0.01'
                        min='0'
                        {...field}
                        value={field.value ?? '0'} // Default display value
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Deductions */}
              <FormField
                control={form.control}
                name='deductions'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor='deductions'>
                      {t('deductions')}
                    </FormLabel>
                    <FormControl>
                      <Input
                        id='deductions'
                        name='deductions'
                        placeholder={t('deductions_placeholder')}
                        type='number'
                        step='0.01'
                        min='0'
                        {...field}
                        value={field.value ?? '0'} // Default display value
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Total Payment */}
              <FormField
                control={form.control}
                name='totalPayment'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor='totalPayment'>
                      {t('total_payment')}*
                    </FormLabel>
                    <FormControl>
                      <Input
                        id='totalPayment'
                        name='totalPayment'
                        placeholder={t('total_payment_placeholder')}
                        type='number'
                        step='0.01'
                        min='0'
                        {...field}
                        value={field.value ?? ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Created By/On Fields */}
              {selectedRow?.createdOn && payrollId && (
                <>
                  <FormField
                    control={form.control}
                    name='userPayrollCreatedName'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel htmlFor='userPayrollCreatedName'>
                          {t('created_by')}
                        </FormLabel>
                        <FormControl>
                          <Input
                            id='userPayrollCreatedName'
                            name='userPayrollCreatedName'
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
                                readOnly={true}
                                variant={'outline'}
                                className={cn(
                                  'pl-3 text-left font-normal',
                                  !field.value && 'text-muted-foreground'
                                )}>
                                {field.value &&
                                  format(new Date(field.value), 'PPP')}
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
                              disabled={true}
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              {/* Updated By/On Fields */}
              {selectedRow?.updatedOn && payrollId && (
                <>
                  <FormField
                    control={form.control}
                    name='userPayrollUpdatedName'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel htmlFor='userPayrollUpdatedName'>
                          {t('updated_by')}
                        </FormLabel>
                        <FormControl>
                          <Input
                            id='userPayrollUpdatedName'
                            name='userPayrollUpdatedName'
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
                                readOnly={true}
                                variant={'outline'}
                                className={cn(
                                  'pl-3 text-left font-normal',
                                  !field.value && 'text-muted-foreground'
                                )}>
                                {field.value &&
                                  format(new Date(field.value), 'PPP')}
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
                              disabled={true}
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

              {payrollId && (
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
                {payrollId ? t('update') : t('save')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

PayrollDialog.propTypes = {
  openDialog: PropTypes.bool.isRequired,
  onCloseDialog: PropTypes.func.isRequired,
  selectedRow: PropTypes.object,
  onSubmit: PropTypes.func.isRequired,
  onDeleteById: PropTypes.func.isRequired,
  actionDialog: PropTypes.string.isRequired
}

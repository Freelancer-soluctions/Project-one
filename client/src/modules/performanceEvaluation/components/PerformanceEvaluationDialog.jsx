import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { zodResolver } from '@hookform/resolvers/zod'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import PropTypes from 'prop-types'

import { PerformanceEvaluationSchema } from '../utils' // Import schema
import { useGetAllEmployeesQuery } from '@/modules/employees/api/employeesApi' // Import employee query

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
import { Calendar } from '@/components/ui/calendar'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea' // Import Textarea
import { Button } from '@/components/ui/button'
import { CalendarIcon, StarIcon } from '@radix-ui/react-icons' // Using StarIcon

export const PerformanceEvaluationDialog = ({
  openDialog,
  onCloseDialog,
  selectedRow,
  onSubmit,
  onDeleteById,
  actionDialog
}) => {
  const { t } = useTranslation()
  const [evaluationId, setEvaluationId] = useState('')

  // Fetch employees
  const { data: employeesData, isLoading: isLoadingEmployees } = useGetAllEmployeesQuery()
  const employeesList = employeesData?.data || []

  const form = useForm({
    resolver: zodResolver(PerformanceEvaluationSchema),
    defaultValues: {
      employeeId: '',
      date: null,
      calification: '', // Use string for Select/Input
      comments: '',
      createdOn: '',
      updatedOn: '',
      userPerformanceEvaluationCreatedName: '', // Assuming field names
      userPerformanceEvaluationUpdatedName: ''
    }
  })

  // Calification options (assuming 1-10)
  const calificationOptions = Array.from({ length: 10 }, (_, i) => ({
    value: (i + 1).toString(),
    label: (i + 1).toString()
  }))

  useEffect(() => {
    if (selectedRow?.id) {
      const mappedValues = {
        id: selectedRow.id,
        employeeId: selectedRow.employeeId,
        date: selectedRow.date ? new Date(selectedRow.date) : null,
        calification: selectedRow.calification?.toString(), // Ensure string
        comments: selectedRow.comments ?? '',
        createdOn: selectedRow.createdOn,
        updatedOn: selectedRow.updatedOn,
        userPerformanceEvaluationCreatedName: selectedRow.userPerformanceEvaluationCreatedName,
        userPerformanceEvaluationUpdatedName: selectedRow.userPerformanceEvaluationUpdatedName
      }
      form.reset(mappedValues)
      setEvaluationId(mappedValues.id)
    } else {
      form.reset({
        employeeId: '',
        date: null,
        calification: '',
        comments: '',
        createdOn: '',
        updatedOn: '',
        userPerformanceEvaluationCreatedName: '',
        userPerformanceEvaluationUpdatedName: ''
      })
      setEvaluationId(null)
    }
  }, [selectedRow, openDialog, form])

  const handleSubmit = data => {
    const submissionData = {
      ...data,
      date: data.date ? format(data.date, 'yyyy-MM-dd') : null,
      calification: Number(data.calification)
    }
    onSubmit(submissionData, evaluationId)
  }

  const handleDelete = () => {
    if (selectedRow?.id) {
      onDeleteById(selectedRow.id)
    }
  }

  return (
    <Dialog open={openDialog} onOpenChange={onCloseDialog}>
      <DialogContent className='sm:max-w-[600px]'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <StarIcon className='inline mr-3 w-7 h-7' /> {/* Changed Icon */}
            {actionDialog}
          </DialogTitle>
          <DialogDescription>
            {evaluationId ? t('edit_evaluation_message') : t('add_evaluation_message')}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            method='post'
            action=''
            id='evaluation-form'
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
                      value={field.value?.toString() ?? ''}
                      disabled={isLoadingEmployees}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('select_employee_placeholder')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
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

              {/* Date Picker */}
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>{t('date')}*</FormLabel>
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
                            date > new Date() || date < new Date("1900-01-01")
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Calification Select/Input */}
               <FormField
                control={form.control}
                name='calification'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('calification')}*</FormLabel>
                     {/* Using Select for predefined scores */}
                     <Select
                       onValueChange={field.onChange}
                       value={field.value?.toString() ?? ''}>
                       <FormControl>
                         <SelectTrigger>
                           <SelectValue placeholder={t('select_calification_placeholder')} />
                         </SelectTrigger>
                       </FormControl>
                       <SelectContent>
                         {calificationOptions.map(option => (
                           <SelectItem key={option.value} value={option.value}>
                             {option.label}
                           </SelectItem>
                         ))}
                       </SelectContent>
                     </Select>
                    {/* Alternative: Input for free number entry
                    <FormControl>
                      <Input
                        id="calification"
                        name="calification"
                        placeholder={t('calification_placeholder')}
                        type="number"
                        min="1"
                        max="10"
                        step="1"
                        {...field}
                        value={field.value ?? ''}
                      />
                    </FormControl> */}
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Comments Textarea */}
              <FormField
                control={form.control}
                name="comments"
                render={({ field }) => (
                  <FormItem className="col-span-2"> {/* Span across two columns */}
                    <FormLabel htmlFor="comments">{t('comments')}</FormLabel>
                    <FormControl>
                      <Textarea
                        id="comments"
                        name="comments"
                        placeholder={t('evaluation_comments_placeholder')}
                        maxLength={200}
                        rows={4}
                        {...field}
                        value={field.value ?? ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Created By/On Fields */}
              {selectedRow?.createdOn && evaluationId && (
                 <>
                   <FormField
                     control={form.control}
                     name='userPerformanceEvaluationCreatedName'
                     render={({ field }) => (
                       <FormItem>
                         <FormLabel htmlFor='userPerformanceEvaluationCreatedName'>
                           {t('created_by')}
                         </FormLabel>
                         <FormControl>
                           <Input
                             id='userPerformanceEvaluationCreatedName'
                             name='userPerformanceEvaluationCreatedName'
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
                                 {field.value && format(new Date(field.value), 'PPP')}
                                 <CalendarIcon className='w-4 h-4 ml-auto opacity-50' />
                               </Button>
                             </FormControl>
                           </PopoverTrigger>
                           <PopoverContent className='w-auto p-0' align='start'>
                             <Calendar
                               mode='single'
                               selected={field.value ? new Date(field.value) : null}
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
              {selectedRow?.updatedOn && evaluationId && (
                 <>
                   <FormField
                     control={form.control}
                     name='userPerformanceEvaluationUpdatedName'
                     render={({ field }) => (
                       <FormItem>
                         <FormLabel htmlFor='userPerformanceEvaluationUpdatedName'>
                           {t('updated_by')}
                         </FormLabel>
                         <FormControl>
                           <Input
                             id='userPerformanceEvaluationUpdatedName'
                             name='userPerformanceEvaluationUpdatedName'
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
                                 {field.value && format(new Date(field.value), 'PPP')}
                                 <CalendarIcon className='w-4 h-4 ml-auto opacity-50' />
                               </Button>
                             </FormControl>
                           </PopoverTrigger>
                           <PopoverContent className='w-auto p-0' align='start'>
                             <Calendar
                               mode='single'
                               selected={field.value ? new Date(field.value) : null}
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

              {evaluationId && (
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
                {evaluationId ? t('update') : t('save')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

PerformanceEvaluationDialog.propTypes = {
  openDialog: PropTypes.bool.isRequired,
  onCloseDialog: PropTypes.func.isRequired,
  selectedRow: PropTypes.object,
  onSubmit: PropTypes.func.isRequired,
  onDeleteById: PropTypes.func.isRequired,
  actionDialog: PropTypes.string.isRequired
} 
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { WarehouseSchema } from '../utils/index'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { LuBuilding2 } from 'react-icons/lu'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import PropTypes from 'prop-types'
import { CalendarIcon } from '@radix-ui/react-icons'
import { Calendar } from '@/components/ui/calendar'
import { format } from 'date-fns'

export const WarehouseDialog = ({
  openDialog,
  onCloseDialog,
  selectedRow,
  dataStatus,
  onSubmit,
  onDeleteById,
  actionDialog
}) => {
  const { t } = useTranslation()
  const [warehouseId, setWarehouseId] = useState('')

  // Configura el formulario
  const form = useForm({
    resolver: zodResolver(WarehouseSchema),
    defaultValues: {
      name: '',
      status: '',
      description: '',
      address: ''
    }
  })

  // Actualiza todos los valores del formulario al cambiar `selectedRow`
  useEffect(() => {
    if (selectedRow) {
      // Filtra y mapea solo los valores necesarios
      const mappedValues = {
        id: selectedRow.id || '',
        name: selectedRow.name || '',
        status: selectedRow.status || '',
        description: selectedRow.description || '',
        address: selectedRow.address || '',
        createdOn: selectedRow.createdOn || '',
        updatedOn: selectedRow.updatedOn || ''
      }

      form.reset(mappedValues)
      setWarehouseId(mappedValues.id)
    }

    if (!openDialog) {
      form.reset()
    }
  }, [selectedRow, openDialog])

  const handleSubmit = data => {
    onSubmit({ ...data }, warehouseId)
  }

  const handleDeleteById = () => {
    onDeleteById(warehouseId)
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
            <LuBuilding2 className='inline mr-3 w-7 h-7' />
            {actionDialog}
          </DialogTitle>
          <DialogDescription>
            {warehouseId ? t('edit_message') : t('add_message')}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            method='post'
            action=''
            id='warehouse-form'
            onSubmit={form.handleSubmit(handleSubmit)}
            noValidate
            className='flex flex-col flex-wrap gap-5'>
            <div className='grid grid-cols-2 gap-6 py-4 auto-rows-auto'>
              <FormField
                control={form.control}
                name='name'
                render={({ field }) => {
                  return (
                    <FormItem>
                      <FormLabel htmlFor='name'>{t('name')}*</FormLabel>
                      <FormControl>
                        <Input
                          id='name'
                          name='name'
                          placeholder={t('warehouse_name_placeholder')}
                          type='text'
                          autoComplete='off'
                          maxLength={50}
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
                name='status'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor='status'>{t('status')}*</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value?.toString()} // Asegura que el valor sea string
                    >
                      <FormControl>
                        <SelectTrigger
                          className={cn(
                            'w-full',
                            !field.value && 'text-muted-foreground'
                          )}>
                          <SelectValue
                            placeholder={t('select_status')}
                            className='w-full'
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {dataStatus.map((item, index) => (
                          <SelectItem key={index} value={item.value.toString()}>
                            {item.label}
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
                    <FormItem className='flex flex-col flex-auto'>
                      <FormLabel htmlFor='description'>
                        {t('description')}
                      </FormLabel>
                      <FormControl>
                        <Input
                          id='description'
                          name='description'
                          placeholder={t('description_placeholder')}
                          type='text'
                          autoComplete='off'
                          maxLength={120}
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
                name='address'
                render={({ field }) => {
                  return (
                    <FormItem className='flex flex-col flex-auto'>
                      <FormLabel htmlFor='address'>{t('address')}</FormLabel>
                      <FormControl>
                        <Input
                          id='address'
                          name='address'
                          placeholder={t('address_placeholder')}
                          type='text'
                          autoComplete='off'
                          maxLength={120}
                          {...field}
                          value={field.value ?? ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )
                }}
              />

              {warehouseId && (
                <>
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
                                {field.value && format(field.value, 'PPP')}
                                <CalendarIcon className='w-4 h-4 ml-auto opacity-50' />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className='w-auto p-0' align='start'>
                            <Calendar
                              mode='single'
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={date => date < new Date('1900-01-01')}
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}
              {warehouseId && selectedRow?.updatedOn && (
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
                              {field.value && format(field.value, 'PPP')}
                              <CalendarIcon className='w-4 h-4 ml-auto opacity-50' />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className='w-auto p-0' align='start'>
                          <Calendar
                            mode='single'
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={date => date < new Date('1900-01-01')}
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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

              {warehouseId && (
                <Button
                  type='button'
                  variant='destructive'
                  className='flex-1 md:flex-initial md:w-24'
                  onClick={() => {
                    handleDeleteById()
                  }}>
                  {t('delete')}
                </Button>
              )}
              <Button
                type='submit'
                variant='info'
                className='flex-1 md:flex-initial md:w-24'>
                {warehouseId ? t('update') : t('save')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

WarehouseDialog.propTypes = {
  openDialog: PropTypes.bool,
  onCloseDialog: PropTypes.func,
  selectedRow: PropTypes.object,
  dataStatus: PropTypes.array,
  onSubmit: PropTypes.func,
  onDeleteById: PropTypes.func,
  actionDialog: PropTypes.string
}

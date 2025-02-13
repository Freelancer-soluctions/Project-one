import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form'
import { Textarea } from '@/components/ui/textarea'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import PropTypes from 'prop-types'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { LuCalendarDays } from 'react-icons/lu'
import { format } from 'date-fns'

import { eventsDialogSchema } from '../utils'
import { useTranslation } from 'react-i18next'

export function EventDialog({
  open,
  onOpenChange,
  onSubmit,
  event,
  dataTypes
}) {
  const { t } = useTranslation()
  const [isPopoverOpen, setIsPopoverOpen] = useState(false) // date picker popover
  // Configura el formulario
  const formEventDialog = useForm({
    resolver: zodResolver(eventsDialogSchema)
  })

  // Actualiza todos los valores del formulario al cambiar `event`
  useEffect(() => {
    if (event) {
      // Filtra y mapea solo los valores necesarios
      const mappedValues = {
        id: event.id || '',
        title: event.title || '',
        description: event.description || '',
        type: event.eventTypeId?.toString() || '',
        speaker: event.speaker || '',
        eventDate: event.eventDate ? new Date(event.eventDate) : '',
        startTime: event.startTime || '',
        endTime: event.endTime || ''
      }

      formEventDialog.reset(mappedValues)
    }
  }, [event])

  const onSubmitDialog = values => {
    onSubmit(values)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[500px]'>
        <DialogHeader>
          <DialogTitle>
            {event.id ? 'Editar Evento' : 'Nuevo Evento'}
          </DialogTitle>
        </DialogHeader>
        <Form {...formEventDialog}>
          <form
            method='post'
            action=''
            id='events-form'
            noValidate
            onSubmit={formEventDialog.handleSubmit(onSubmitDialog)}>
            <div className='my-4'>
              <FormField
                control={formEventDialog.control}
                name='title'
                render={({ field }) => {
                  return (
                    <FormItem className='flex flex-col flex-auto col-span-1'>
                      <FormLabel htmlFor='title'>{t('title')}*</FormLabel>
                      <FormControl>
                        <Input
                          id='title'
                          type='text'
                          maxLength={50}
                          placeholder={t('title_placeholder')}
                          {...field}
                          value={field.value ?? ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )
                }}
              />
            </div>

            <div className='my-4'>
              <FormField
                control={formEventDialog.control}
                name='speaker'
                render={({ field }) => {
                  return (
                    <FormItem className='flex flex-col flex-auto col-span-1'>
                      <FormLabel htmlFor='speaker'>{t('speaker')}*</FormLabel>
                      <FormControl>
                        <Input
                          id='speaker'
                          type='text'
                          maxLength={50}
                          placeholder={t('speaker_placeholder')}
                          {...field}
                          value={field.value ?? ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )
                }}
              />
            </div>
            <div className='my-4'>
              <FormField
                control={formEventDialog.control}
                name='type'
                render={({ field }) => {
                  return (
                    <FormItem className='flex flex-col flex-auto'>
                      <FormLabel htmlFor='type'>{t('type')}*</FormLabel>
                      <Select
                        id='type'
                        onValueChange={value => {
                          field.onChange(value)
                        }}
                        value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t('select_type')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {dataTypes.map((item, index) => (
                            <SelectItem
                              value={item.id.toString()}
                              key={item.id}>
                              {item.description}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )
                }}
              />
            </div>
            <div className='my-4 '>
              <FormField
                control={formEventDialog.control}
                name='eventDate'
                render={({ field }) => (
                  <FormItem className='flex flex-col flex-auto'>
                    <FormLabel htmlFor='eventDate'>{t('date')}</FormLabel>
                    <Popover
                      modal={true}
                      open={isPopoverOpen}
                      onOpenChange={setIsPopoverOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            id='eventDate'
                            variant={'outline'}
                            className={cn(
                              'pl-3 text-left font-normal',
                              !field.value && 'text-muted-foreground'
                            )}>
                            {field.value ? (
                              format(field.value, 'PPP')
                            ) : (
                              <span>{t('pick_date')}</span>
                            )}
                            <LuCalendarDays className='w-4 h-4 ml-auto opacity-50' />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className='w-auto p-0' align='start'>
                        <Calendar
                          mode='single'
                          selected={field.value}
                          onSelect={value => {
                            field.onChange(value)
                          }}
                          // onSelect={field.onChange}
                          disabled={date => date < new Date('1900-01-01')}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className='my-4'>
              <FormField
                control={formEventDialog.control}
                name='startTime'
                render={({ field }) => {
                  return (
                    <FormItem className='flex flex-col flex-auto col-span-1'>
                      <FormLabel htmlFor='startTime'>
                        {t('start_time')}*
                      </FormLabel>
                      <FormControl>
                        <Input
                          id='startTime'
                          type='time'
                          {...field}
                          value={field.value ?? ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )
                }}
              />
            </div>
            <div className='my-4'>
              <FormField
                control={formEventDialog.control}
                name='endTime'
                render={({ field }) => {
                  return (
                    <FormItem className='flex flex-col flex-auto col-span-1'>
                      <FormLabel htmlFor='endTime'>{t('end_time')}*</FormLabel>
                      <FormControl>
                        <Input
                          id='endTime'
                          type='time'
                          {...field}
                          value={field.value ?? ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )
                }}
              />
            </div>

            <div className='my-4'>
              <FormField
                control={formEventDialog.control}
                name='description'
                render={({ field }) => {
                  return (
                    <FormItem className='flex flex-col flex-auto col-span-1'>
                      <FormLabel htmlFor='description'>
                        {t('description')}*
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          id='description'
                          placeholder={t('description_placeholder')}
                          className='resize-none'
                          maxLength={200}
                          {...field}
                          value={field.value ?? ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )
                }}
              />
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type='button' variant='secondary'>
                  {t('close')}
                </Button>
              </DialogClose>
              <Button type='submit' variant='info'>
                {event.id ? t('save_changes') : t('save')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

EventDialog.propTypes = {
  open: PropTypes.bool.required,
  onOpenChange: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  event: PropTypes.object.required,
  dataTypes: PropTypes.array.isRequired
}

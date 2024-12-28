import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { newsDialogSchema } from '../utils'
import { useUpdateNewByIdMutation } from '../slice/newsSlice'

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
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { CalendarIcon } from '@radix-ui/react-icons'
import { PiNewspaperClippingThin } from 'react-icons/pi'
import { Calendar } from '@/components/ui/calendar'
import { format, formatISO } from 'date-fns'
import { cn } from '@/lib/utils'

export const NewsDialog = ({
  openDialog,
  setSelectedRow,
  selectedRow,
  setOpenDialog,
  actionDialog,
  datastatus
}) => {
  const [newId, setNewId] = useState('')
  const [updateNewById, { isLoading, isError, isSuccess }] =
    useUpdateNewByIdMutation()

  // Configura el formulario
  const formDialog = useForm({
    resolver: zodResolver(newsDialogSchema),
    defaultValues: {
      id: '',
      description: '',
      document: '',
      createdOn: '',
      createdBy: '',
      closedOn: '',
      status: '',
      userNewsCreated: '',
      userNewsClosed: ''
    }
  })

  // const { setValue } = formDialog

  // Actualiza todos los valores del formulario al cambiar `selectedRow`
  useEffect(() => {
    if (selectedRow) {
      // Filtra y mapea solo los valores necesarios
      const mappedValues = {
        id: selectedRow.id || '',
        description: selectedRow.description || '',
        document: selectedRow.document || '',
        createdOn: selectedRow.createdOn || '',
        createdBy: selectedRow.createdBy || '',
        closedOn: selectedRow.closedOn || '',
        status: selectedRow.status?.description || '',
        userNewsCreated: selectedRow.userNewsCreated?.name || '',
        userNewsClosed: selectedRow.userNewsClosed?.name || ''
      }

      // // Usa `setValue` para aplicar todos los valores al formulario
      // Object.entries(mappedValues).forEach(([key, value]) => {
      //   setValue(key, value)
      // })

      formDialog.reset(mappedValues)
      setNewId(mappedValues.id || '')
    }
  }, [selectedRow])

  const onSubmitDialog = async values => {
    console.log('newid', newId)

    if (newId) {
      console.log('onSubmitDialog', values)
    } else {
      try {
        const result = await updateNewById({
          id: newId,
          ...values
        }).unwrap() // Desenvuelve la respuesta para manejar errores
        console.log('Update successful:', result)
      } catch (err) {
        console.error('Error updating:', err)
      }
    }
  }
  return (
    <>
      <Dialog
        open={openDialog}
        onOpenChange={isOpen => {
          if (isOpen === true) return
          setSelectedRow({})
          setOpenDialog(false)
        }}>
        {/* <DialogTrigger asChild>
          <Button variant='outline'>Edit Profile</Button>
        </DialogTrigger> */}
        <DialogContent className=''>
          <DialogHeader>
            <DialogTitle>
              <PiNewspaperClippingThin className='inline mr-3 w-7 h-7' />
              {actionDialog} new
            </DialogTitle>
            <DialogDescription>
              Make changes to new data here. Click save when you're done.
            </DialogDescription>
          </DialogHeader>

          <Form {...formDialog}>
            <form
              method='post'
              action=''
              id='profile-info-form'
              noValidate
              onSubmit={formDialog.handleSubmit(onSubmitDialog)}>
              <div className='grid grid-cols-2 gap-6 py-4 auto-rows-auto'>
                <FormField
                  control={formDialog.control}
                  name='document'
                  render={({ field }) => {
                    return (
                      <FormItem className='flex flex-col flex-auto col-span-1'>
                        <FormLabel>Document</FormLabel>
                        <FormControl>
                          <Input id='file' name='document' type='file' />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )
                  }}
                />
                {/* status */}
                {newId ? (
                  <FormField
                    control={formDialog.control}
                    name='status'
                    render={({ field }) => {
                      return (
                        <FormItem className='flex flex-col flex-auto col-span-1'>
                          <FormLabel>Status</FormLabel>
                          <FormControl>
                            <Input
                              id='status'
                              name='status'
                              type='text'
                              autoComplete='false'
                              readOnly={true}
                              disabled={true}
                              {...field}
                              value={field.value ?? ''}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )
                    }}
                  />
                ) : (
                  <FormField
                    control={formDialog.control}
                    name='status'
                    render={({ field }) => {
                      return (
                        <FormItem className='flex flex-col flex-auto'>
                          <FormLabel>Status*</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder='Select a status' />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {datastatus?.data.map((item, index) => (
                                <SelectItem value={item.code} key={index}>
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
                )}

                {/* created by */}
                {newId && (
                  <FormField
                    control={formDialog.control}
                    name='userNewsCreated'
                    render={({ field }) => {
                      return (
                        <FormItem className='flex flex-col flex-auto col-span-1'>
                          <FormLabel>Created By</FormLabel>
                          <FormControl>
                            <Input
                              id='userNewsCreated'
                              name='userNewsCreated'
                              type='text'
                              autoComplete='false'
                              readOnly={true}
                              disabled={true}
                              {...field}
                              value={field.value ?? ''}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )
                    }}
                  />
                )}

                {/* created on */}
                {newId && (
                  <FormField
                    control={formDialog.control}
                    name='createdOn'
                    render={({ field }) => (
                      <FormItem className='flex flex-col flex-auto'>
                        <FormLabel>Created On</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
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
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {/* closed by */}
                {newId && (
                  <FormField
                    control={formDialog.control}
                    name='userNewsClosed'
                    render={({ field }) => {
                      return (
                        <FormItem className='flex flex-col flex-auto col-span-1'>
                          <FormLabel>Closed By</FormLabel>
                          <FormControl>
                            <Input
                              id='userNewsClosed'
                              name='userNewsClosed'
                              type='text'
                              autoComplete='false'
                              readOnly={true}
                              disabled={true}
                              {...field}
                              value={field.value ?? ''}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )
                    }}
                  />
                )}

                {/* closed on */}
                {newId && (
                  <FormField
                    control={formDialog.control}
                    name='closedOn'
                    render={({ field }) => (
                      <FormItem className='flex flex-col flex-auto'>
                        <FormLabel>Closed On</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={'outline'}
                                className={cn(
                                  'pl-3 text-left font-normal',
                                  !field.value && 'text-muted-foreground'
                                )}>
                                {field.value ? (
                                  format(field.value, 'PPP')
                                ) : (
                                  <span>Pick a date</span>
                                )}
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
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={formDialog.control}
                  name='description'
                  render={({ field }) => {
                    return (
                      <FormItem className='flex flex-col flex-auto col-span-2'>
                        <FormLabel>Description*</FormLabel>
                        <FormControl>
                          {/* <Input
                            id='description'
                            name='description'
                            placeholder='Enter the description'
                            type='text'
                            autoComplete='false'
                            maxLength={30}
                            {...field}
                            value={field.value ?? ''}
                          /> */}
                          <Textarea
                            placeholder='Enter the description'
                            className='resize-none'
                            maxLength={400}
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
                {/* <Button
                  type='button'
                  variant='secondary'
                  onClick={() => {
                    setOpenDialog(false)
                  }}>
                  Close
                </Button> */}
                <DialogClose asChild>
                  <Button type='button' variant='secondary'>
                    Close
                  </Button>
                </DialogClose>
                {newId && (
                  <Button type='submit' variant='destructive'>
                    Delete
                  </Button>
                )}

                <Button type='submit' variant='info'>
                  Save
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  )
}

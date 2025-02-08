import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router'
import { zodResolver } from '@hookform/resolvers/zod'
import { newsDialogSchema, NewsStatusCode } from '../utils'
import {
  useUpdateNewByIdMutation,
  useCreateNewMutation,
  useDeleteNewByIdMutation
} from '../slice/newsSlice'
import { useSelector } from 'react-redux'

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
import AlertDialogComponent from '@/components/alertDialog/AlertDialog'

import { format, formatISO } from 'date-fns'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import PropTypes from 'prop-types'

export const NewsDialog = ({
  openDialog,
  setSelectedRow,
  selectedRow,
  setOpenDialog,
  actionDialog,
  datastatus
}) => {
  const { t } = useTranslation()
  const [newId, setNewId] = useState('')
  const [statusCodeSaved, setStatusCodeSaved] = useState('')
  const [alertProps, setAlertProps] = useState({})
  const [openAlertDialog, setOpenAlertDialog] = useState(false) //alert dialog open/close
  const navigate = useNavigate()

  const [
    updateNewById,
    { isLoading: isLoadingPut, isError: isErrorPut, isSuccess: isSuccessPut }
  ] = useUpdateNewByIdMutation()

  const [
    createNew,
    { isLoading: isLoadingPost, isError: isErrorPost, isSuccess: isSuccessPost }
  ] = useCreateNewMutation()

  const [
    deleteNewById,
    {
      isLoading: isLoadingDelete,
      isError: isErrorDelete,
      isSuccess: isSuccessDelete
    }
  ] = useDeleteNewByIdMutation()

  // Accediendo al estado de autenticación
  const user = useSelector(state => state.auth.user)

  // Configura el formulario
  const formDialog = useForm({
    resolver: zodResolver(newsDialogSchema)
  })

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
        status: selectedRow.status || '',
        userNewsCreated: selectedRow.userNewsCreated?.name || '',
        userNewsClosed: selectedRow.userNewsClosed?.name || '',
        userNewsPending: selectedRow.userNewsPending?.name || ''
      }

      // // Usa `setValue` para aplicar todos los valores al formulario
      // Object.entries(mappedValues).forEach(([key, value]) => {
      //   setValue(key, value)
      // })

      formDialog.reset(mappedValues)
      setNewId(mappedValues.id || '')
      setStatusCodeSaved(mappedValues.status.code || '')
    }
  }, [selectedRow])

  const onSubmitDialog = async values => {
    try {
      const result = newId
        ? await updateNewById({
            id: newId,
            data: {
              description: values.description,
              statusId: values.status.id,
              statusCode: values.status.code,
              document: values.document
            }
          }).unwrap()
        : await createNew({
            document: values.document,
            statusId: values.status.id,
            statusCode: values.status.code,
            description: values.description
          }).unwrap()

      setOpenAlertDialog(true)
      setAlertProps({
        alertTitle: t(newId ? 'update_record' : 'add_record'),
        alertMessage: t(newId ? 'updated_successfully' : 'added_successfully'),
        cancel: false,
        success: true,
        onSuccess: () => {
          navigate('/home')
        },
        variantSuccess: 'info'
      })
    } catch (err) {
      console.error(`Error ${newId ? 'updating' : 'creating'}:`, err)
    }
  }

  const onDeleteNewById = async id => {
    setAlertProps({
      alertTitle: t('delete_record'),
      alertMessage: t('request_delete_record'),
      cancel: true,
      success: false,
      destructive: true,
      variantSuccess: '',
      variantDestructive: 'destructive',
      onSuccess: () => {},
      onDelete: async () => {
        try {
          await deleteNewById(id).unwrap()

          setAlertProps({
            alertTitle: '',
            alertMessage: t('deleted_successfully'),
            cancel: false,
            success: true,
            onSuccess: () => {
              navigate('/home')
            },
            variantSuccess: 'info'
          })
          setOpenAlertDialog(true) // Open alert dialog
        } catch (err) {
          console.error('Error deleting:', err)
        }
      }
    })
    setOpenAlertDialog(true) // Open alert dialog
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              <PiNewspaperClippingThin className='inline mr-3 w-7 h-7' />
              {actionDialog}
            </DialogTitle>
            <DialogDescription>
              {newId ? t('edit_message') : t('add_message')}
            </DialogDescription>
          </DialogHeader>

          <Form {...formDialog}>
            <form
              method='post'
              action=''
              id='news-form'
              noValidate
              onSubmit={formDialog.handleSubmit(onSubmitDialog)}>
              <div className='grid grid-cols-2 gap-6 py-4 auto-rows-auto'>
                <FormField
                  control={formDialog.control}
                  name='document'
                  render={({ field }) => {
                    return (
                      <FormItem className='flex flex-col flex-auto col-span-1'>
                        <FormLabel htmlFor='file'>{t('document')}</FormLabel>
                        <FormControl>
                          <Input
                            id='file'
                            name='document'
                            type='file'
                            disabled={
                              newId && statusCodeSaved === NewsStatusCode.CLOSED
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )
                  }}
                />
                {/* status */}
                <FormField
                  control={formDialog.control}
                  name='status'
                  render={({ field }) => {
                    // extract only the neccessary status
                    const dataStatus = !newId
                      ? datastatus?.data.filter(
                          item => item.code !== NewsStatusCode.CLOSED
                        )
                      : [...datastatus?.data]

                    return (
                      <FormItem className='flex flex-col flex-auto'>
                        <FormLabel htmlFor='status'>{t('status')}*</FormLabel>
                        <Select
                          id='status'
                          disabled={
                            newId && statusCodeSaved === NewsStatusCode.CLOSED
                          }
                          onValueChange={value => {
                            // Buscar el objeto completo por el `code`
                            const selectedStatus = dataStatus.find(
                              item => item.code === value
                            )
                            if (selectedStatus) {
                              field.onChange(selectedStatus) // Asignar el objeto completo
                            }
                          }}
                          // Usar el `code` del objeto seleccionado para mantener consistencia
                          value={field.value?.code}>
                          {/* <Select
                          onValueChange={value => {
                            field.onChange(value) // Actualiza solo el `code`
                            console.log('valor field nuevo', field.value)
                          }}
                          value={field.value.code}> */}
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t('select_status')} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {dataStatus.map((item, index) => (
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

                {/* created by */}
                {newId && (
                  <FormField
                    control={formDialog.control}
                    name='userNewsCreated'
                    render={({ field }) => {
                      return (
                        <FormItem className='flex flex-col flex-auto col-span-1'>
                          <FormLabel htmlFor='userNewsCreated'>
                            {t('created_by')}
                          </FormLabel>
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
                        <FormLabel htmlFor='createOn'>
                          {t('created_on')}
                        </FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                id='createOn'
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
                {newId && statusCodeSaved === NewsStatusCode.CLOSED && (
                  <FormField
                    control={formDialog.control}
                    name='userNewsClosed'
                    render={({ field }) => {
                      return (
                        <FormItem className='flex flex-col flex-auto col-span-1'>
                          <FormLabel htmlFor='userNewsClosed'>
                            {t('closed_by')}
                          </FormLabel>
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
                {newId && statusCodeSaved === NewsStatusCode.CLOSED && (
                  <FormField
                    control={formDialog.control}
                    name='closedOn'
                    render={({ field }) => (
                      <FormItem className='flex flex-col flex-auto'>
                        <FormLabel htmlFor='closedOn'>
                          {t('closed_on')}
                        </FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                id='closedOn'
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

                <FormField
                  control={formDialog.control}
                  name='description'
                  render={({ field }) => {
                    return (
                      <FormItem className='flex flex-col flex-auto col-span-2'>
                        <FormLabel htmlFor='description'>
                          {t('description')}*
                        </FormLabel>
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
                            id='description'
                            placeholder={t('description_placeholder')}
                            className='resize-none'
                            maxLength={400}
                            disabled={
                              newId && statusCodeSaved === NewsStatusCode.CLOSED
                            }
                            {...field}
                            value={field.value ?? ''}
                            defaultValues={field.value}
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
                    {t('close')}
                  </Button>
                </DialogClose>
                {newId && (
                  <Button
                    type='button'
                    variant='destructive'
                    onClick={() => {
                      onDeleteNewById(newId)
                    }}>
                    {t('delete')}
                  </Button>
                )}

                {statusCodeSaved !== NewsStatusCode.CLOSED && (
                  <Button type='submit' variant='info'>
                    {t('save')}
                  </Button>
                )}
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialogComponent
        openAlertDialog={openAlertDialog}
        setOpenAlertDialog={setOpenAlertDialog}
        alertProps={alertProps}
      />
    </>
  )
}

NewsDialog.propTypes = {
  openDialog: PropTypes.bool.isRequired,
  setSelectedRow: PropTypes.func,
  selectedRow: PropTypes.object,
  setOpenDialog: PropTypes.func,
  actionDialog: PropTypes.string,
  datastatus: PropTypes.object
}

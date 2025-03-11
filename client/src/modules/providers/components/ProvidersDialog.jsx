import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { NewsDialogSchema, NewsStatusCode } from '../utils'

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
import { LuNewspaper } from 'react-icons/lu'
import { Calendar } from '@/components/ui/calendar'
import { format, formatISO } from 'date-fns'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import PropTypes from 'prop-types'

export const ProvidersDialog = ({
  open,
  onClose,
  onSubmit,
  selectedRow,
  dataStatus,
  isLoadingStatus,
  isFetchingStatus
}) => {
  const { t } = useTranslation()
  const [newId, setNewId] = useState('')
  const [statusCodeSaved, setStatusCodeSaved] = useState('')

  // Configura el formulario
  const form = useForm({
    resolver: zodResolver(NewsDialogSchema),
    defaultValues: {
      description: selectedRow?.description || '',
      status: selectedRow?.status || '',
      userProvidersCreated: selectedRow?.userProvidersCreated?.name || '',
      userProvidersClosed: selectedRow?.userProvidersClosed?.name || '',
      userProvidersPending: selectedRow?.userProvidersPending?.name || ''
    }
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
        status: selectedRow.status || {},
        userProvidersCreated: selectedRow.userProvidersCreated?.name || '',
        userProvidersClosed: selectedRow.userProvidersClosed?.name || '',
        userProvidersPending: selectedRow.userProvidersPending?.name || ''
      }

      // // Usa `setValue` para aplicar todos los valores al formulario
      // Object.entries(mappedValues).forEach(([key, value]) => {
      //   setValue(key, value)
      // })

      form.reset(mappedValues)
      setNewId(mappedValues.id || '')
      setStatusCodeSaved(mappedValues.status.code || '')
    }

    if (!open) {
      form.reset()
    }
  }, [selectedRow, open])

  const handleSubmit = data => {
    const formData = {
      ...data,
      id: selectedRow?.id
    }
    onSubmit(formData)
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className='sm:max-w-[425px]'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <LuNewspaper className='inline mr-3 w-7 h-7' />
            {selectedRow ? t('edit_provider') : t('add_provider')}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            id='providers-form'
            onSubmit={form.handleSubmit(handleSubmit)}
            className='space-y-8'
          >
            <FormField
              control={form.control}
              name='description'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('description')}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t('description')}
                      className='resize-none'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='status'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('status')}</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={
                      isLoadingStatus ||
                      isFetchingStatus ||
                      (selectedRow?.id &&
                        selectedRow.statusCode === NewsStatusCode.CLOSED)
                    }
                  >
                    <FormControl>
                      <SelectTrigger
                        className={cn(
                          'w-full',
                          !field.value && 'text-muted-foreground'
                        )}
                      >
                        <SelectValue
                          placeholder={t('select_status')}
                          className='w-full'
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {dataStatus?.data
                        .filter(
                          item => item.code !== NewsStatusCode.CLOSED
                        )
                        .map(item => (
                          <SelectItem key={item.id} value={item}>
                            {item.description}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {selectedRow?.id && (
              <>
                <FormField
                  control={form.control}
                  name='userProvidersCreated'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel htmlFor='userProvidersCreated'>
                        {t('created_by')}
                      </FormLabel>
                      <FormControl>
                        <Input
                          id='userProvidersCreated'
                          name='userProvidersCreated'
                          disabled
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {selectedRow?.id &&
                  selectedRow.statusCode === NewsStatusCode.CLOSED && (
                    <FormField
                      control={form.control}
                      name='userProvidersClosed'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel htmlFor='userProvidersClosed'>
                            {t('closed_by')}
                          </FormLabel>
                          <FormControl>
                            <Input
                              id='userProvidersClosed'
                              name='userProvidersClosed'
                              disabled
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                {selectedRow?.id &&
                  selectedRow.statusCode === NewsStatusCode.PENDING && (
                    <FormField
                      control={form.control}
                      name='userProvidersPending'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel htmlFor='userProvidersPending'>
                            {t('pending_by')}
                          </FormLabel>
                          <FormControl>
                            <Input
                              id='userProvidersPending'
                              name='userProvidersPending'
                              disabled
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
              </>
            )}

            <div className='flex justify-end gap-2'>
              <Button
                type='button'
                variant='secondary'
                onClick={onClose}
              >
                {t('cancel')}
              </Button>
              <Button
                type='submit'
                disabled={
                  selectedRow?.id &&
                  selectedRow.statusCode === NewsStatusCode.CLOSED
                }
              >
                {selectedRow ? t('update') : t('save')}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

ProvidersDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  selectedRow: PropTypes.object,
  dataStatus: PropTypes.object,
  isLoadingStatus: PropTypes.bool,
  isFetchingStatus: PropTypes.bool
}

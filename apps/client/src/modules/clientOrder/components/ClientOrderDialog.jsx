import { useEffect } from 'react'
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
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { LuUsersRound } from 'react-icons/lu'
import PropTypes from 'prop-types'
import { ClientOrderSchema } from '../utils'
import { useState } from 'react'
import { orderStatus } from '@/lib/constants'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export const ClientOrderDialog = ({
  openDialog,
  onCloseDialog,
  selectedRow,
  onSubmit,
  onDeleteById,
  actionDialog
}) => {
  const { t } = useTranslation()
  const [clientOrderId, setClientOrderId] = useState('')

  const form = useForm({
    resolver: zodResolver(ClientOrderSchema),
    defaultValues: {
      clientId: '',
      status: '',
      notes: '',
      saleId: ''
    }
  })

  // Actualiza todos los valores del formulario al cambiar `selectedRow`
  useEffect(() => {
    if (selectedRow?.id) {
      // Filtra y mapea solo los valores necesarios
      const mappedValues = {
        id: selectedRow.id,
        clientId: selectedRow.clientId,
        status: selectedRow.status,
        notes: selectedRow.notes,
        saleId: selectedRow.saleId
      }

      form.reset(mappedValues)
      setClientOrderId(mappedValues.id)
    }

    if (!openDialog) {
      form.reset({
        clientId: '',
        status: '',
        notes: '',
        saleId: ''
      })
      setClientOrderId(null)
    }
  }, [selectedRow, openDialog])

  const handleSubmit = data => {
    onSubmit(data, clientOrderId)
  }

  const handleDelete = () => {
    onDeleteById(selectedRow.id)
  }

  return (
    <Dialog open={openDialog} onOpenChange={onCloseDialog}>
      <DialogContent className='sm:max-w-[600px]'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <LuUsersRound className='inline mr-3 w-7 h-7' />
            {actionDialog}
          </DialogTitle>
          <DialogDescription>
            {clientOrderId ? t('edit_message') : t('add_message')}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            method='post'
            action=''
            id='clientOrder-form'
            noValidate
            onSubmit={form.handleSubmit(handleSubmit)}
            className='flex flex-col flex-wrap gap-5'>
            <div className='grid grid-cols-2 gap-6 py-4 auto-rows-auto'>
              <FormField
                control={form.control}
                name='clientId'
                render={({ field }) => {
                  return (
                    <FormItem>
                      <FormLabel htmlFor='clientId'>{t('clientId')}*</FormLabel>
                      <FormControl>
                        <Input
                          id='clientId'
                          name='clientId'
                          placeholder={t('clientOrder_clientId_placeholder')}
                          type='number'
                          autoComplete='off'
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
                    <FormLabel htmlFor="status">{t("status")}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("Select a status")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {orderStatus.map((status) => (
                          <SelectItem key={status.value} value={status.value}>
                            {status.label}
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
                name='notes'
                render={({ field }) => {
                  return (
                    <FormItem>
                      <FormLabel htmlFor='notes'>{t('notes')}</FormLabel>
                      <FormControl>
                        <Input
                          id='notes'
                          name='notes'
                          placeholder={t('clientOrder_notes_placeholder')}
                          type='text'
                          autoComplete='off'
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
                name='saleId'
                render={({ field }) => {
                  return (
                    <FormItem>
                      <FormLabel htmlFor='saleId'>{t('saleId')}</FormLabel>
                      <FormControl>
                        <Input
                          id='saleId'
                          name='saleId'
                          placeholder={t('clientOrder_saleId_placeholder')}
                          type='number'
                          autoComplete='off'
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
                <Button
                  type='button'
                  variant='secondary'
                  className='flex-1 md:flex-initial md:w-24'>
                  {t('cancel')}
                </Button>
              </DialogClose>

              {clientOrderId && (
                <Button
                  type='button'
                  variant='destructive'
                  className='flex-1 md:flex-initial md:w-24'
                  onClick={() => {
                    handleDelete()
                  }}>
                  {t('delete')}
                </Button>
              )}
              <Button
                type='submit'
                variant='info'
                className='flex-1 md:flex-initial md:w-24'>
                {clientOrderId ? t('update') : t('save')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

ClientOrderDialog.propTypes = {
  openDialog: PropTypes.bool.isRequired,
  onCloseDialog: PropTypes.func.isRequired,
  selectedRow: PropTypes.object,
  onSubmit: PropTypes.func.isRequired,
  onDeleteById: PropTypes.func.isRequired,
  actionDialog: PropTypes.string.isRequired
}
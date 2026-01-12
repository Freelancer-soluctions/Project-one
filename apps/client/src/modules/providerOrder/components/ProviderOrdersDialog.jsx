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
import { LuPackage } from 'react-icons/lu'
import PropTypes from 'prop-types'
import { ProviderOrderSchema } from '../utils'
import { useState } from 'react'

export const ProviderOrdersDialog = ({
  openDialog,
  onCloseDialog,
  selectedRow,
  onSubmit,
  onDeleteById,
  actionDialog
}) => {
  const { t } = useTranslation()
  const [providerOrderId, setProviderOrderId] = useState('')

  const form = useForm({
    resolver: zodResolver(ProviderOrderSchema),
    defaultValues: {
      supplierId: '',
      notes: '',
      createdOn: '',
      updatedOn: '',
      userProviderOrderCreatedName: '',
      userProviderOrderUpdatedName: ''
    }
  })

  // Actualiza todos los valores del formulario al cambiar `selectedRow`
  useEffect(() => {
    if (selectedRow?.id) {
      // Filtra y mapea solo los valores necesarios
      const mappedValues = {
        id: selectedRow.id,
        supplierId: selectedRow.supplierId,
        notes: selectedRow.notes,
        createdOn: selectedRow.createdOn,
        updatedOn: selectedRow.updatedOn,
        userProviderOrderCreatedName: selectedRow.userProviderOrderCreatedName,
        userProviderOrderUpdatedName: selectedRow.userProviderOrderUpdatedName
      }

      form.reset(mappedValues)
      setProviderOrderId(mappedValues.id)
    }

    if (!openDialog) {
      form.reset({
        supplierId: '',
        notes: '',
        createdOn: '',
        updatedOn: '',
        userProviderOrderCreatedName: '',
        userProviderOrderUpdatedName: ''
      })
      setProviderOrderId(null)
    }
  }, [selectedRow, openDialog])

  const handleSubmit = data => {
    onSubmit(data, providerOrderId)
  }

  const handleDelete = () => {
    onDeleteById(selectedRow.id)
  }

  return (
    <Dialog open={openDialog} onOpenChange={onCloseDialog}>
      <DialogContent className='sm:max-w-[600px]'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <LuPackage className='inline mr-3 w-7 h-7' />
            {actionDialog}
          </DialogTitle>
          <DialogDescription>
            {providerOrderId ? t('edit_message') : t('add_message')}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            method='post'
            action=''
            id='provider-order-form'
            noValidate
            onSubmit={form.handleSubmit(handleSubmit)}
            className='flex flex-col flex-wrap gap-5'>
            <div className='grid grid-cols-1 gap-6 py-4 auto-rows-auto'>
              <FormField
                control={form.control}
                name='supplierId'
                render={({ field }) => {
                  return (
                    <FormItem>
                      <FormLabel htmlFor='supplierId'>
                        {t('supplierId')}
                      </FormLabel>
                      <FormControl>
                        <Input
                          id='supplierId'
                          name='supplierId'
                          placeholder={t('supplierId')}
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
                name='notes'
                render={({ field }) => {
                  return (
                    <FormItem>
                      <FormLabel htmlFor='notes'>{t('notes')}</FormLabel>
                      <FormControl>
                        <Input
                          id='notes'
                          name='notes'
                          placeholder={t('notes_placeholder')}
                          type='text'
                          autoComplete='off'
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

              {selectedRow?.createdOn && providerOrderId && (
                <FormField
                  control={form.control}
                  name='userProviderOrderCreatedName'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel htmlFor='userProviderOrderCreatedName'>
                        {t('created_by')}
                      </FormLabel>
                      <FormControl>
                        <Input
                          id='userProviderOrderCreatedName'
                          name='userProviderOrderCreatedName'
                          disabled
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              {selectedRow?.updatedOn && providerOrderId && (
                <FormField
                  control={form.control}
                  name='userProviderOrderUpdatedName'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel htmlFor='userProviderOrderUpdatedName'>
                        {t('updated_by')}
                      </FormLabel>
                      <FormControl>
                        <Input
                          id='userProviderOrderUpdatedName'
                          name='userProviderOrderUpdatedName'
                          disabled
                          {...field}
                        />
                      </FormControl>
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

              {providerOrderId && (
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
                {providerOrderId ? t('update') : t('save')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

ProviderOrdersDialog.propTypes = {
  openDialog: PropTypes.bool.isRequired,
  onCloseDialog: PropTypes.func.isRequired,
  selectedRow: PropTypes.object,
  onSubmit: PropTypes.func.isRequired,
  onDeleteById: PropTypes.func.isRequired,
  actionDialog: PropTypes.string.isRequired
}

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
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { CalendarIcon } from '@radix-ui/react-icons'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { LuUsersRound } from 'react-icons/lu'
import PropTypes from 'prop-types'
import { UserSchema } from '../utils'
import { useState } from 'react'

export const UsersDialog = ({
  openDialog,
  onCloseDialog,
  selectedRow,
  onSubmit,
  onDeleteById,
  actionDialog
}) => {
  const { t } = useTranslation()
  const [userId, setUserId] = useState('')

  const form = useForm({
    resolver: zodResolver(UserSchema),
    
  })

  // Actualiza todos los valores del formulario al cambiar `selectedRow`
  useEffect(() => {
    if (selectedRow?.id) {
      // Filtra y mapea solo los valores necesarios
      const mappedValues = {
        id: selectedRow.id,
        name: selectedRow.name,
        email: selectedRow.email,
        telephone: selectedRow.telephone,
        address: selectedRow.address,
        birthday: selectedRow.birthday,
        startDate: selectedRow.startDate,
        socialSecurity: selectedRow.socialSecurity,
        zipcode: selectedRow.zipcode,
        state: selectedRow.state,
        city: selectedRow.city,
        isAdmin: selectedRow.isAdmin,
        picture: selectedRow.picture,
        document: selectedRow.document,
        roleId: selectedRow.roleId,
        statusId: selectedRow.statusId,
      }

      form.reset(mappedValues)
      setUserId(mappedValues.id)
    }

    if (!openDialog) {
      form.reset({
        name: '',
        email: '',
        telephone: '',
        address: '',
        birthday: '',
        startDate: '',
        socialSecurity: '',
        zipcode: '',
        state: '',
        city: '',
        isAdmin: false,
        picture: '',
        document: '',
        roleId: '',
        statusId: '',
      })
      setUserId(null)
    }
  }, [selectedRow, openDialog])

  const handleSubmit = data => {
    onSubmit(data, userId)
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
            {t('edit_message')}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            method='post'
            action=''
            id='user-form'
            noValidate
            onSubmit={form.handleSubmit(handleSubmit)}
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
                          placeholder={t('user_name_placeholder')}
                          type='text'
                          autoComplete='off'
                          maxLength={100}
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
                name='email'
                render={({ field }) => {
                  return (
                    <FormItem>
                      <FormLabel htmlFor='email'>{t('email')}*</FormLabel>
                      <FormControl>
                        <Input
                          id='email'
                          name='email'
                          placeholder={t('user_email_placeholder')}
                          type='email'
                          autoComplete='off'
                          maxLength={254}
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
                name='telephone'
                render={({ field }) => {
                  return (
                    <FormItem>
                      <FormLabel htmlFor='telephone'>{t('telephone')}*</FormLabel>
                      <FormControl>
                        <Input
                          id='telephone'
                          name='telephone'
                          placeholder={t('user_telephone_placeholder')}
                          type='tel'
                          autoComplete='off'
                          maxLength={15}
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
                    <FormItem>
                      <FormLabel htmlFor='address'>{t('address')}</FormLabel>
                      <FormControl>
                        <Input
                          id='address'
                          name='address'
                          placeholder={t('user_address_placeholder')}
                          type='text'
                          autoComplete='off'
                          maxLength={250}
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
                name='birthday'
                render={({ field }) => (
                  <FormItem className='flex flex-col flex-auto'>
                    <FormLabel htmlFor='birthday'>{t('birthday')}*</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            id='birthday'
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

              <FormField
                control={form.control}
                name='startDate'
                render={({ field }) => (
                  <FormItem className='flex flex-col flex-auto'>
                    <FormLabel htmlFor='startDate'>{t('start_date')}*</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            id='startDate'
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

              <FormField
                control={form.control}
                name='socialSecurity'
                render={({ field }) => {
                  return (
                    <FormItem>
                      <FormLabel htmlFor='socialSecurity'>{t('social_security')}*</FormLabel>
                      <FormControl>
                        <Input
                          id='socialSecurity'
                          name='socialSecurity'
                          placeholder={t('user_social_security_placeholder')}
                          type='text'
                          autoComplete='off'
                          maxLength={9}
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
                name='zipcode'
                render={({ field }) => {
                  return (
                    <FormItem>
                      <FormLabel htmlFor='zipcode'>{t('zipcode')}*</FormLabel>
                      <FormControl>
                        <Input
                          id='zipcode'
                          name='zipcode'
                          placeholder={t('user_zipcode_placeholder')}
                          type='text'
                          autoComplete='off'
                          maxLength={9}
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
                name='state'
                render={({ field }) => {
                  return (
                    <FormItem>
                      <FormLabel htmlFor='state'>{t('state')}</FormLabel>
                      <FormControl>
                        <Input
                          id='state'
                          name='state'
                          placeholder={t('user_state_placeholder')}
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
                name='city'
                render={({ field }) => {
                  return (
                    <FormItem>
                      <FormLabel htmlFor='city'>{t('city')}</FormLabel>
                      <FormControl>
                        <Input
                          id='city'
                          name='city'
                          placeholder={t('user_city_placeholder')}
                          type='text'
                          autoComplete='off'
                          maxLength={35}
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
                name='isAdmin'
                render={({ field }) => (
                  <FormItem className='flex items-center space-x-2'>
                    <FormLabel htmlFor='isAdmin'>{t('is_admin')}</FormLabel>
                    <FormControl>
                      <Input
                        type='checkbox'
                        id='isAdmin'
                        checked={field.value}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='picture'
                render={({ field }) => {
                  return (
                    <FormItem>
                      <FormLabel htmlFor='picture'>{t('picture')}</FormLabel>
                      <FormControl>
                        <Input
                          id='picture'
                          name='picture'
                          placeholder={t('user_picture_placeholder')}
                          type='document'
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
                name='document'
                render={({ field }) => {
                  return (
                    <FormItem>
                      <FormLabel htmlFor='document'>{t('document')}</FormLabel>
                      <FormControl>
                        <Input
                          id='document'
                          name='document'
                          placeholder={t('user_document_placeholder')}
                          type='document'
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
                name='roleId'
                render={({ field }) => {
                  return (
                    <FormItem>
                      <FormLabel htmlFor='roleId'>{t('role_id')}*</FormLabel>
                      <FormControl>
                        <Input
                          id='roleId'
                          name='roleId'
                          placeholder={t('user_role_id_placeholder')}
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
                name='statusId'
                render={({ field }) => {
                  return (
                    <FormItem>
                      <FormLabel htmlFor='statusId'>{t('status_id')}*</FormLabel>
                      <FormControl>
                        <Input
                          id='statusId'
                          name='statusId'
                          placeholder={t('user_status_id_placeholder')}
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
                name='userPermitId'
                render={({ field }) => {
                  return (
                    <FormItem>
                      <FormLabel htmlFor='userPermitId'>{t('user_permit_id')}*</FormLabel>
                      <FormControl>
                        <Input
                          id='userPermitId'
                          name='userPermitId'
                          placeholder={t('user_permit_id_placeholder')}
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

              {userId && (
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
                {userId ? t('update') : t('save')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

UsersDialog.propTypes = {
  openDialog: PropTypes.bool.isRequired,
  onCloseDialog: PropTypes.func.isRequired,
  selectedRow: PropTypes.object,
  onSubmit: PropTypes.func.isRequired,
  onDeleteById: PropTypes.func.isRequired,
  actionDialog: PropTypes.string.isRequired
}
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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { UserSchema } from '../utils'
import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useEffect, useState } from 'react'
import { LuBarcode } from 'react-icons/lu'

export const UsersBasicInfo = ({
  onSubmitCreateEdit,
  onDelete,
  dataStatus,
  selectedRow
}) => {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [id, setId] = useState()

  const form = useForm({
    resolver: zodResolver(UserSchema)
  })

  // Actualiza todos los valores del formulario al cambiar `selectedRow`
  useEffect(() => {
    if (selectedRow?.id) {
      form.reset({
        ...selectedRow,
        status: {
          id: selectedRow.statusId,
          code: selectedRow.statusCode,
          description: selectedRow.statusDescription
        }
      })
      setId(selectedRow.id)
    } else {
      form.reset()
    }
  }, [selectedRow, form])

  const submitForm = data => {
    onSubmitCreateEdit(data)
  }

  const handleDelete = id => {
    onDelete(id)
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('product_information')}</CardTitle>
        <CardDescription>{t('product_basic_information_msg')}</CardDescription>
      </CardHeader>
      <CardContent className='space-y-4'>
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
                      <FormLabel htmlFor='telephone'>
                        {t('telephone')}*
                      </FormLabel>
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
                    <FormLabel htmlFor='startDate'>
                      {t('start_date')}*
                    </FormLabel>
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
                      <FormLabel htmlFor='socialSecurity'>
                        {t('social_security')}*
                      </FormLabel>
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
                      <FormLabel htmlFor='statusId'>
                        {t('status_id')}*
                      </FormLabel>
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
                      <FormLabel htmlFor='userPermitId'>
                        {t('user_permit_id')}*
                      </FormLabel>
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
            <div className='flex flex-wrap items-center justify-between gap-3 mt-5 md:justify-normal'>
              <Button
                type='button'
                variant='secondary'
                onClick={() => {
                  navigate('/home', { replace: true })
                }}>
                {t('cancel')}
              </Button>
              {id && (
                <Button
                  type='button'
                  variant='destructive'
                  onClick={() => {
                    handleDelete(id)
                  }}>
                  {t('delete')}
                </Button>
              )}
              <Button type='submit' variant='info'>
                {t('save')}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}

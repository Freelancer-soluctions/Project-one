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
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { UserSchema } from '../utils'
import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion'
import { LuUser } from 'react-icons/lu'
import { LucideUserCheck } from 'lucide-react'

export const UsersBasicInfo = ({
  onSubmit,
  onDelete,
  dataStatus,
  dataRol,
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
        birthday: selectedRow.birthday
          ? new Date(selectedRow.birthday).toISOString().split('T')[0]
          : '',
        startDate: selectedRow.startDate
          ? new Date(selectedRow.startDate).toISOString().split('T')[0]
          : '',
        lastUpdatedOn: selectedRow.lastUpdatedOn
          ? new Date(selectedRow.lastUpdatedOn).toISOString().split('T')[0]
          : '',
        status: {id:selectedRow.statusId, code:selectedRow.statusCode, description:selectedRow.statusDescription  },
        roles: {id:selectedRow.roleId, code:selectedRow.roleCode, description:selectedRow.roleDescription  },
      })
      setId(selectedRow.id)
    } else {
      form.reset()
    }
  }, [selectedRow, form])

  const submitForm = data => {
    onSubmit(data)
  }

  const handleDelete = id => {
    onDelete(id)
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('user_information')}</CardTitle>
        <CardDescription>{t('user_basic_information_msg')}</CardDescription>
      </CardHeader>
      <CardContent className='space-y-4'>
        <Form {...form}>
          <form
            method='post'
            action=''
            id='user-form'
            noValidate
            onSubmit={form.handleSubmit(submitForm)}
            className='flex flex-col flex-wrap gap-5'>
            <Accordion type='single' collapsible className='w-full'>
              <AccordionItem
                value='info'
                className='mb-2 border rounded-md shadow-sm border-border bg-card'>
                <AccordionTrigger className='px-4 py-4 hover:bg-accent hover:no-underline rounded-t-md'>
                  <div className='flex items-center gap-2'>
                    <LuUser className='w-5 h-5' />
                    <span className='font-medium'>{t('user_information')}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className='pt-4 pb-2 px-4 max-h-[50vh] overflow-y-auto scrollbar-thin'>
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
                            <FormLabel htmlFor='address'>
                              {t('address')}
                            </FormLabel>
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
                          <FormLabel htmlFor='birthday'>
                            {t('birthday')}
                          </FormLabel>
                          <FormControl>
                            <Input
                              id='birthday'
                              name='birthday'
                              disabled
                              type='date'
                              {...field}
                              value={field.value}
                            />
                          </FormControl>
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
                            {t('start_date')}
                          </FormLabel>
                          <FormControl>
                            <Input
                              id='startDate'
                              name='startDate'
                              disabled
                              type='date'
                              {...field}
                              value={field.value}
                            />
                          </FormControl>
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
                                placeholder={t(
                                  'user_social_security_placeholder'
                                )}
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
                            <FormLabel htmlFor='zipcode'>
                              {t('zipcode')}*
                            </FormLabel>
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
                            <FormLabel htmlFor='state'>{t('state')}*</FormLabel>
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
                            <FormLabel htmlFor='city'>{t('city')}*</FormLabel>
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
                      name='picture'
                      render={({ field }) => {
                        return (
                          <FormItem>
                            <FormLabel htmlFor='picture'>
                              {t('picture')}
                            </FormLabel>
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
                            <FormLabel htmlFor='document'>
                              {t('document')}
                            </FormLabel>
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
                      name='roles'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel htmlFor='rol'>{t('rol')}*</FormLabel>
                          <Select
                             onValueChange={code => {
                            // Buscar el objeto completo por el `code`
                            if (dataRol.length > 0){
                              const selected= dataRol.find(
                                item => item.code === code
                              )
                              if (selected) {
                                field.onChange(selected) // Asignar el objeto completo
                              }
                            }
                          
                          }}
                          value={field.value?.code}>
                            <FormControl>
                              <SelectTrigger
                                className={cn(
                                  'w-full',
                                  !field.value && 'text-muted-foreground'
                                )}>
                                <SelectValue
                                  placeholder={t('select_role')}
                                  className='w-full'
                                />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {dataRol.map((item, index) => (
                                <SelectItem
                                  key={index}
                                  value={item.code}>
                                  {item.description}
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
                      name='status'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel htmlFor='status'>{t('status')}*</FormLabel>
                           <Select
                             onValueChange={code => {
                            // Buscar el objeto completo por el `code`
                            if (dataStatus.length > 0){
                              const selected= dataStatus.find(
                                item => item.code === code
                              )
                              if (selected) {
                                field.onChange(selected) // Asignar el objeto completo
                              }
                            }
                          
                          }}
                          value={field.value?.code}>
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
                                <SelectItem
                                  key={index}
                                  value={item.code}>
                                  {item.description}
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
                      name='lastUpdatedByName'
                      render={({ field }) => {
                        return (
                          <FormItem className='flex flex-col flex-auto col-span-1'>
                            <FormLabel htmlFor='lastUpdatedByName'>
                              {t('updated_by')}
                            </FormLabel>
                            <FormControl>
                              <Input
                                id='lastUpdatedByName'
                                name='lastUpdatedByName'
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

                    <FormField
                      control={form.control}
                      name='lastUpdatedOn'
                      render={({ field }) => (
                        <FormItem className='flex flex-col flex-auto'>
                          <FormLabel htmlFor='lastUpdatedOn'>
                            {t('updated_on')}
                          </FormLabel>
                          <FormControl>
                            <Input
                              id='lastUpdatedOn'
                              name='lastUpdatedOn'
                              disabled
                              type='date'
                              {...field}
                              value={field.value}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name='isAdmin'
                      render={({ field }) => (
                        <FormItem className='flex flex-row items-start p-4 space-x-3 space-y-0 border rounded-md'>
                          <FormControl>
                            <Checkbox
                              id='isAdmin'
                              name='isAdmin'
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className='space-y-1 leading-none'>
                            <FormLabel htmlFor='isAdmin'>
                              {t('is_admin')}
                            </FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem
                value='permits'
                className='mb-2 border rounded-md shadow-sm border-border bg-card'>
                <AccordionTrigger className='px-4 py-4 hover:bg-accent hover:no-underline rounded-t-md'>
                  <div className='flex items-center gap-2'>
                    <LucideUserCheck className='w-5 h-5' />
                    <span className='font-medium'>{t('user_permits')}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className='pt-4 pb-2 px-4 max-h-[50vh] overflow-y-auto scrollbar-thin'>
                  <div className='grid grid-cols-3 gap-6 py-4 auto-rows-auto'>
                    <FormField
                      control={form.control}
                      name='accessConfiguration'
                      render={({ field }) => (
                        <FormItem className='flex items-center space-x-2'>
                          <FormControl>
                            <Checkbox
                              className='mt-2'
                              id='accessConfiguration'
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel
                            htmlFor='accessConfiguration'
                            className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'>
                            {t('access_configuration')}
                          </FormLabel>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name='accessNews'
                      render={({ field }) => (
                        <FormItem className='flex items-center space-x-2'>
                          <FormControl>
                            <Checkbox
                              className='mt-2'
                              id='accessNews'
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel
                            htmlFor='accessNews'
                            className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'>
                            {t('access_news')}
                          </FormLabel>
                        </FormItem>
                      )}
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
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
                {t('edit')}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}

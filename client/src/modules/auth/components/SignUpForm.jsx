import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { signUpSchema } from '../utils/schema'

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
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { CalendarIcon } from '@radix-ui/react-icons'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { useTranslation } from 'react-i18next'

export const SignUpForm = () => {
  const { t } = useTranslation()
  const form = useForm({ resolver: zodResolver(signUpSchema) })
  const onSubmit = data => {
    console.log(data)
  }
  return (
    <>
      <div className='border shadow rounded-xl bg-card text-card-foreground'>
        <Form {...form}>
          <form
            method='post'
            action=''
            id='profile-info-form'
            noValidate
            onSubmit={form.handleSubmit(onSubmit)}
            className='w-full p-10 space-y-5 '>
            <FormField
              control={form.control}
              name='fname'
              render={({ field }) => {
                return (
                  <FormItem>
                    <FormLabel>{t('first_name')}</FormLabel>
                    <FormControl>
                      <Input
                        id='fname'
                        name='fname'
                        placeholder={t('sign_name_placeholder')}
                        type='text'
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
              name='lname'
              render={({ field }) => {
                return (
                  <FormItem>
                    <FormLabel>{t('last_name')}</FormLabel>
                    <FormControl>
                      <Input
                        id='lname'
                        name='lname'
                        placeholder={t('sign_last_name_placeholder')}
                        type='text'
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
                    <FormLabel>{t('email')}</FormLabel>
                    <FormControl>
                      <Input
                        id='email'
                        name='email'
                        placeholder={t('sign_email_placeholder')}
                        type='email'
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
              name='password'
              render={({ field }) => {
                return (
                  <FormItem>
                    <FormLabel>{t('password')}</FormLabel>
                    <FormControl>
                      <Input
                        id='password'
                        name='password'
                        placeholder={t('sign_password_placeholder')}
                        // autoComplete="current-password"
                        type='password'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )
              }}
            />
            <FormField
              control={form.control}
              name='rpassword'
              render={({ field }) => {
                return (
                  <FormItem>
                    <FormLabel>{t('password')}</FormLabel>
                    <FormControl>
                      <Input
                        id='rpassword'
                        name='rpassword'
                        placeholder={t('sign_confirm_password_placeholder')}
                        // autoComplete="current-password"
                        type='password'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )
              }}
            />

            <FormField
              control={form.control}
              name='dob'
              render={({ field }) => (
                <FormItem className='flex flex-col'>
                  <FormLabel>{t('date_of_birth')}</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={'outline'}
                          className={cn(
                            ' pl-3 text-left font-normal',
                            !field.value && 'text-muted-foreground'
                          )}>
                          {field.value ? (
                            format(field.value, 'PPP')
                          ) : (
                            <span>{t('pick_date')}</span>
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
                        disabled={date =>
                          date > new Date() || date < new Date('1900-01-01')
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>

                  <FormMessage />
                </FormItem>
              )}
            />

            <div className='flex items-center justify-center'>
              <Button type='submit' className='flex-1'>
                {t('sign_last_name_placeholder')}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </>
  )
}

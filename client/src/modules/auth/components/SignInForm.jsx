import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { signInSchema } from '../utils/schemas'
import { Link, useNavigate } from 'react-router'
import { useDispatch, useSelector } from 'react-redux'
import { signInFetch } from '../slice/authSlice'
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
import { Spinner } from '../../../components/loader/Spinner'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'

export const SignInForm = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  // const state = useSelector(state => state) todos los estados
  const { user, isError, isLoading } = useSelector(state => state.auth)
  const form = useForm({ resolver: zodResolver(signInSchema) })
  const { t } = useTranslation()

  const onSubmit = ({ email, password }) => {
    dispatch(signInFetch({ email, password }))
  }

  useEffect(() => {
    console.log('state', user)
    if (!isError && user && !user?.error) {
      navigate('/home', { replace: true })
    } else {
      //Mostrar mensaje de error
    }
  }, [user, isError])

  // const handleChangeEmail = useCallback(
  //   e => dispatch(updateAuthData(e.target.value)),
  //   [dispatch]
  // )

  const checkState = () => {
    console.log('newSate', user)
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
                        autoComplete='false'
                        // onChange={handleChangeEmail(event)}
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
                    <FormLabel>{t('email')}</FormLabel>
                    <FormControl>
                      <Input
                        id='password'
                        name='password'
                        placeholder={t('sign_password_placeholder')}
                        autoComplete='current-password'
                        type='password'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )
              }}
            />
            <div className='flex items-center justify-between'>
              <p>{t('remind_me')}</p>
              <Link className='text-sm font-medium text-gray-900 underline underline-offset-4 hover:text-gray-700 dark:text-gray-50 dark:hover:text-gray-300'>
                {t('forgot_password')}
              </Link>
            </div>
            <div className='flex items-center justify-center'>
              <Button type='submit' className='flex-1'>
                {t('sign_in')}
              </Button>
            </div>
          </form>
        </Form>
      </div>

      {isLoading && <Spinner />}

      <div>
        <button onClick={checkState}>revisar state</button>
      </div>
    </>
  )
}

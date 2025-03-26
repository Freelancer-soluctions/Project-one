import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
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
import { LuPlus, LuSearch, LuEraser } from 'react-icons/lu'
import PropTypes from 'prop-types'

export const ClientsFiltersForm = ({ onSubmit, onAddDialog }) => {
  const { t } = useTranslation()
  const form = useForm({
    defaultValues: {
      name: '',
      email: ''
    }
  })

  const handleSubmit = data => {
    onSubmit(data)
  }

  const handleAdd = () => {
    onAddDialog()
  }

  const handleResetFilter = () => {
    form.reset()
  }

  return (
    <Form {...form}>
      <form
        method='post'
        action=''
        id='client-filters-form'
        noValidate
        onSubmit={form.handleSubmit(handleSubmit)}
        className='flex flex-col flex-wrap gap-5'>
        {/* inputs */}
        <div className='flex flex-wrap flex-1 gap-3'>
          <FormField
            control={form.control}
            name='name'
            render={({ field }) => {
              return (
                <FormItem className='flex flex-col flex-auto'>
                  <FormLabel htmlFor='name'>{t('name')}</FormLabel>
                  <FormControl>
                    <Input
                      id='name'
                      name='name'
                      placeholder={t('client_name_placeholder')}
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
                <FormItem className='flex flex-col flex-auto'>
                  <FormLabel htmlFor='email'>{t('email')}</FormLabel>
                  <FormControl>
                    <Input
                      id='email'
                      name='email'
                      placeholder={t('client_email_placeholder')}
                      type='email'
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
        </div>
        {/* buttons */}
        <div className='flex flex-wrap items-center justify-between gap-3 mt-5 md:justify-normal'>
          <Button
            type='submit'
            className='flex-1 md:flex-initial md:w-24'
            variant='info'>
            {t('search')}
            <LuSearch className='w-4 h-4 ml-auto opacity-50' />
          </Button>
          <Button
            type='button'
            className='flex-1 md:flex-initial md:w-24'
            variant='success'
            onClick={handleAdd}>
            {t('add')} <LuPlus className='w-4 h-4 ml-auto opacity-50' />
          </Button>
          <Button
            type='button'
            className='flex-1 md:flex-initial md:w-24'
            variant='outline'
            onClick={() => handleResetFilter()}>
            {t('clear')} <LuEraser className='w-4 h-4 ml-auto opacity-50' />
          </Button>
        </div>
      </form>
    </Form>
  )
}

ClientsFiltersForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  onAddDialog: PropTypes.func
} 
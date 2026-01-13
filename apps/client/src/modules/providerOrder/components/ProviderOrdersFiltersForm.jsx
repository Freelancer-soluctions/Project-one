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
import { ProviderOrdersFiltersSchema } from '../utils'
import { zodResolver } from '@hookform/resolvers/zod'

export const ProviderOrdersFiltersForm = ({ onSubmit, onAddDialog }) => {
  const { t } = useTranslation()
  const form = useForm({
    resolver: zodResolver(ProviderOrdersFiltersSchema)
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
        id='provider-order-filters-form'
        noValidate
        onSubmit={form.handleSubmit(handleSubmit)}
        className='flex flex-col flex-wrap gap-5'>
        {/* inputs */}
        <div className='flex flex-wrap flex-1 gap-3'>
          <FormField
            control={form.control}
            name='supplierId'
            render={({ field }) => {
              return (
                <FormItem className='flex flex-col flex-auto'>
                  <FormLabel htmlFor='supplierId'>{t('supplierId')}</FormLabel>
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

ProviderOrdersFiltersForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  onAddDialog: PropTypes.func
}

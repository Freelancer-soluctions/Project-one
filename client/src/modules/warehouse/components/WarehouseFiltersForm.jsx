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

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { LuPlus, LuSearch, LuEraser } from 'react-icons/lu'

import PropTypes from 'prop-types'

export const WarehouseFiltersForm = ({ onSubmit, dataStatus, onAddDialog }) => {
  const { t } = useTranslation()
  const form = useForm({
    defaultValues: {
      name: '',
      status: ''
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
        id='warehouse-filters-form'
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
                      placeholder={t('warehouse_name_placeholder')}
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
            name='status'
            render={({ field }) => {
              return (
                <FormItem className='flex flex-col flex-auto'>
                  <FormLabel htmlFor='status'>{t('status')}</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value?.toString()} // Asegura que el valor sea string
                  >
                    <FormControl id='status'>
                      <SelectTrigger>
                        <SelectValue placeholder={t('select_status')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {dataStatus.map((item, index) => (
                        <SelectItem value={item.value.toString()} key={index}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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

WarehouseFiltersForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  dataStatus: PropTypes.array,
  onAddDialog: PropTypes.func
}

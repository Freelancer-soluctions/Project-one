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

export const ProductsFiltersForm = ({
  onSubmit,
  onOpenProductsForms,
  datastatus,
  dataCategory,
  dataProviders
}) => {
  const { t } = useTranslation() // Accede a las traducciones

  // Configura el formulario
  const formFilter = useForm({
    defaultValues: {
      name: '',
      category: '',
      type: '',
      status: '',
      providers: ''
    }
  })

  //form event
  const handleSubmitFilter = ({ name, category, type, status }) => {
    onSubmit({
      name,
      productCategoryCode: category.code,
      productTypeCode: type.code,
      statusCode: status.code
    })
  }

  const handleAdd = () => {
    onOpenProductsForms()
  }

  const handleResetFilter = () => {
    formFilter.reset()
  }

  return (
    <>
      <Form {...formFilter}>
        <form
          method='post'
          action=''
          id='profile-info-form'
          noValidate
          onSubmit={formFilter.handleSubmit(handleSubmitFilter)}
          className='flex flex-col flex-wrap gap-5'>
          {/* inputs */}
          <div className='flex flex-wrap flex-1 gap-3'>
            <FormField
              control={formFilter.control}
              name='name'
              render={({ field }) => {
                return (
                  <FormItem className='flex flex-col flex-auto'>
                    <FormLabel htmlFor='name'>{t('name')}</FormLabel>
                    <FormControl>
                      <Input
                        id='name'
                        name='description'
                        placeholder={t('description_placeholder')}
                        type='text'
                        autoComplete='false'
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
              control={formFilter.control}
              name='status'
              render={({ field }) => {
                return (
                  <FormItem className='flex flex-col flex-auto'>
                    <FormLabel htmlFor='status'>{t('status')}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl id='status'>
                        <SelectTrigger>
                          <SelectValue placeholder={t('select_status')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {datastatus?.data.map((item, index) => (
                          <SelectItem value={item.code} key={index}>
                            {item.description}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )
              }}
            />

            <FormField
              control={formFilter.control}
              name='category'
              render={({ field }) => {
                return (
                  <FormItem className='flex flex-col flex-auto'>
                    <FormLabel htmlFor='status'>{t('category')}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl id='category'>
                        <SelectTrigger>
                          <SelectValue placeholder={t('select_category')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {dataCategory?.data.map((item, index) => (
                          <SelectItem value={item.code} key={index}>
                            {item.description}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )
              }}
            />

            <FormField
              control={formFilter.control}
              name='providers'
              render={({ field }) => {
                return (
                  <FormItem className='flex flex-col flex-auto'>
                    <FormLabel htmlFor='providers'>{t('providers')}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl id='providers'>
                        <SelectTrigger>
                          <SelectValue placeholder={t('select_providers')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {dataProviders?.data.map((item, index) => (
                          <SelectItem value={item.code} key={index}>
                            {item.name}
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
              onClick={() => handleAdd()}>
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
    </>
  )
}

ProductsFiltersForm.propTypes = {
  trigger: PropTypes.func,
  setActionDialog: PropTypes.func,
  setOpenDialog: PropTypes.func,
  datastatus: PropTypes.object,
  dataCategory: PropTypes.object,
  dataTypes: PropTypes.object
}

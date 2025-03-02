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
import { ProductsSchema } from '../utils'
import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useState } from 'react'
import {
  LuPackage,
  LuArrowLeft,
  LuPlus,
  LuTrash2,
  LuBarcode,
  LuSave
} from 'react-icons/lu'

export const ProductBasicInfo = ({
  onSubmitCreateEdit,
  dataCategory,
  dataTypes,
  datastatus
}) => {
  const navigate = useNavigate()
  const { t } = useTranslation()

  const generateBarcode = () => {
    // Simulación de generación de código de barras
    const randomCode = Math.floor(Math.random() * 10000000000)
      .toString()
      .padStart(10, '0')
      form.setValue("barcode", randomCode, { shouldValidate: true }); // Asigna y valida el campo
  }
  
  const form = useForm({
    resolver: zodResolver(ProductsSchema),
    defaultValues: {
      name: '',
      sku: '',
      description: '',
      barcode: '',
    //   category: '',
    //   type: '',
    //   status: ''
    }
  })

console.log("dfdfdfd", dataCategory?.data)
  
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
            id='profile-info-form'
            noValidate
            onSubmit={form.handleSubmit(onSubmitCreateEdit)}
            className='flex flex-col flex-wrap gap-5'>
            <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
              <div className='space-y-2'>
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
                            type='text'
                            name='name'
                            maxLength='80'
                            autoComplete='false'
                            placeholder={t('enter_product_name_placeholder')}
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
              <div className='space-y-2'>
                <FormField
                  control={form.control}
                  name='sku'
                  render={({ field }) => {
                    return (
                      <FormItem>
                        <FormLabel htmlFor='sku'>{t('sku')}*</FormLabel>
                        <FormControl>
                          <Input
                            id='sku'
                            type='text'
                            name='sku'
                            maxLength="16"
                            autoComplete='false'
                            placeholder={t(
                              'enter_unique_product_code_placeholder'
                            )}
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
            </div>

            <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
              <div className='space-y-2'>
                <FormField
                  control={form.control}
                  name='category'
                  render={({ field }) => {

                    return (
                      <FormItem>
                        <FormLabel htmlFor='status'>{t('category')}*</FormLabel>
                        <Select
                        //   onValueChange={field.onChange}
                          onValueChange={code => {
                            // Buscar el objeto completo por el `code`
                            const selectedStatus = dataCategory.data.find(
                              item => item.code === code
                            )
                            if (selectedStatus) {
                              field.onChange(selectedStatus) // Asignar el objeto completo
                            }
                          }}
                          value={field.value}>
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
              </div>
              
              <div className='space-y-2'>
                <FormField
                  control={form.control}
                  name='type'
                  render={({ field }) => {
                    return (
                      <FormItem>
                        <FormLabel htmlFor='type'>{t('type')}*</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}>
                          <FormControl id='type'>
                            <SelectTrigger>
                              <SelectValue placeholder={t('select_type')} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {dataTypes?.data.map((item, index) => (
                              <SelectItem value={item.id} key={index}>
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
              </div>
              <div className='space-x-2'>
                <FormField
                  control={form.control}
                  name='status'
                  render={({ field }) => {
                    return (
                      <FormItem>
                        <FormLabel htmlFor='status'>{t('status')}*</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}>
                          <FormControl id='status'>
                            <SelectTrigger>
                              <SelectValue placeholder={t('select_status')} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {datastatus?.data.map((item, index) => (
                              <SelectItem value={item.id} key={index}>
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
              </div>
            </div>

            <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
              <div className='space-y-2'>
                <FormField
                  control={form.control}
                  name='price'
                  render={({ field }) => {
                    return (
                      <FormItem>
                        <FormLabel htmlFor='price'>{t('price')}*</FormLabel>
                        <FormControl>
                          <Input
                            id='price'
                            type='number'
                            placeholder='0.00'
                            name='price'
                            autoComplete='false'
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
              <div className='space-y-2'>
                <FormField
                  control={form.control}
                  name='cost'
                  render={({ field }) => {
                    return (
                      <FormItem>
                        <FormLabel htmlFor='price'>{t('cost')}*</FormLabel>
                        <FormControl>
                          <Input
                            id='cost'
                            type='number'
                            placeholder='0.00'
                            name='cost'
                            autoComplete='false'
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
              <div className='space-y-2'>
                <FormField
                  control={form.control}
                  name='stock'
                  render={({ field }) => {
                    return (
                      <FormItem>
                        <FormLabel htmlFor='stock'>
                          {t('initial_stock')}*
                        </FormLabel>
                        <FormControl>
                          <Input
                            id='stock'
                            type='number'
                            placeholder='0'
                            name='stock'
                            autoComplete='false'
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
            </div>

            <div className='space-y-2'>
              <FormField
                control={form.control}
                name='description'
                render={({ field }) => {
                  return (
                    <FormItem className='flex flex-col flex-auto col-span-2'>
                      <FormLabel htmlFor='description'>
                        {t('description')}
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          id='description'
                          placeholder={t(
                            'detailed_product_description_placeholder'
                          )}
                          className='resize-none'
                          autoComplete='false'
                          maxLength={2000}
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

            <div className='space-y-2'>
              <div className='flex gap-2'>
                <div className='flex-1'>
                  <FormField
                    className='flex-initial'
                    control={form.control}
                    name='barcode'
                    render={({ field }) => {
                      return (
                        <FormItem>
                          <FormLabel htmlFor='barcode'>
                            {t('barcode')}
                          </FormLabel>
                          <FormControl>
                            <Input
                              id='barcode'
                              type='text'
                              name='barcode'
                              autoComplete='false'
                              placeholder={t(
                                'generate_barcode_automatically_placeholder'
                              )}
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
                <div className='space-y-2'>
                  <Button
                    className='mt-8'
                    type='button'
                    variant='outline'
                    onClick={generateBarcode}>
                    <LuBarcode className='w-4 h-4 mr-2' />
                    {t('generate')}
                  </Button>
                </div>
              </div>
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

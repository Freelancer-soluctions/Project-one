import { useForm } from 'react-hook-form'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage
} from '@/components/ui/form'
import { attributesSchema } from '../utils'
import { LuTrash2, LuPlus } from 'react-icons/lu'
import { useTranslation } from 'react-i18next'
import { useEffect } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'

export const ProductAttributes = ({
  onRemoveAttribute,
  onAddAttribute,
  onEditAttribute,
  attributes,
  onSubmitFormAttributes
}) => {
  const { t } = useTranslation()
  const form = useForm({
    resolver: zodResolver(attributesSchema),
    defaultValues: { attributes: attributes }
  })

  //Para actualizar el formulario con relacion al state
  useEffect(() => {
    form.reset({ attributes })
  }, [attributes, form])

  const submitFormAttribute = data => {
    if (data.attributes.length === 0) return
    onSubmitFormAttributes(data.attributes)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('product_attributes')}</CardTitle>
        <CardDescription>{t('add_custom_attributes')}</CardDescription>
      </CardHeader>
      <CardContent className='space-y-4'>
        <Form {...form}>
          <form
            id='products-attributes-form'
            noValidate
            onSubmit={form.handleSubmit(submitFormAttribute)}
            className='flex flex-col flex-wrap gap-5'>
            <div className='space-y-4 overflow-y-auto max-h-80'>
              {attributes.map((attribute, index) => (
                <div key={index} className='flex items-end gap-4'>
                  {/* Nombre del atributo */}
                  <FormField
                    control={form.control}
                    name={`attributes.${index}.name`}
                    render={({ field }) => (
                      <FormItem className='flex-1 space-y-2'>
                        <FormLabel htmlFor={`attribute-name-${index}`}>
                          {t('attribute_name')}*
                        </FormLabel>
                        <FormControl>
                          <Input
                            id={`attribute-name-${index}`}
                            type='text'
                            maxLength='50'
                            autoComplete='off'
                            placeholder={t('attribute_name_placeholder')}
                            {...field}
                            onChange={e => {
                              field.onChange(e.target.value) // Actualizar react-hook-form
                              onEditAttribute(index, 'name', e.target.value) // Actualizar el estado manualmente
                            }}
                            value={field.value ?? ''}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Valor del atributo */}
                  <FormField
                    control={form.control}
                    name={`attributes.${index}.description`}
                    render={({ field }) => (
                      <FormItem className='flex-1 space-y-2'>
                        <FormLabel htmlFor={`attribute-description-${index}`}>
                          {t('description')}*
                        </FormLabel>
                        <FormControl>
                          <Input
                            id={`attribute-description-${index}`}
                            type='text'
                            maxLength='100'
                            autoComplete='off'
                            placeholder={t('attribute_value_placeholder')}
                            {...field}
                            onChange={e => {
                              field.onChange(e.target.value) // Actualizar react-hook-form
                              onEditAttribute(
                                index,
                                'description',
                                e.target.value
                              ) // Actualizar el estado manualmente
                            }}
                            value={field.value ?? ''}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Botón de eliminación */}
                  <Button
                    type='button'
                    variant='ghost'
                    size='icon'
                    onClick={() => onRemoveAttribute(index, attribute)}>
                    <LuTrash2 className='w-4 h-4' />
                  </Button>
                </div>
              ))}
            </div>

            {/* Botón para agregar nuevo atributo */}
            <div className='flex flex-wrap items-center justify-between gap-3 mt-5 md:justify-normal'>
            <Button type='button' variant='success' onClick={onAddAttribute}>
                <LuPlus className='w-4 h-4 mr-2' />
                {t('add_attribute')}
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

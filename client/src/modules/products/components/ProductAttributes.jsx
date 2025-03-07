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
import { LuTrash2, LuPlus } from 'react-icons/lu'
import { useTranslation } from 'react-i18next'

export const ProductAttributes = ({
  onRemoveAttribute,
  onAddAttribute,
  onEditAttribute,
  dataAttributes,
  onSubmitSaveAttributes
}) => {
  const { t } = useTranslation()
  const form = useForm({
    defaultValues: { attributes: dataAttributes || [] }
  })
  const submitFormAttribute = (data) => {
    onSubmitSaveAttributes(data);
  };
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('product_attributes')}</CardTitle>
        <CardDescription>{t('add_custom_attributes')}</CardDescription>
      </CardHeader>
      <CardContent className='space-y-4'>
        <Form {...form}>
          <form
            method='post'
            action=''
            id='products-attributes-form'
            noValidate
            onSubmit={form.handleSubmit(submitFormAttribute)}
            className='flex flex-col flex-wrap gap-5'>
            {dataAttributes.map((attribute, index) => (
              <div key={attribute.id} className='flex items-end gap-4'>
                <FormField
                  control={form.control}
                  name={`attributes.${index}.name`}
                  render={({ field }) => (
                    <FormItem className='flex-1 space-y-2'>
                      <FormLabel htmlFor={`attributes.${index}.name`}>
                        {t('attribute_name')}
                      </FormLabel>
                      <FormControl>
                        <Input
                          id={`attributes.${index}.name`}
                          type='text'
                          maxLength='50'
                          autoComplete='off'
                          placeholder={t('attribute_name_placeholder')}
                          onChange={(e) => onEditAttribute(attribute.id, "name", e.target.value)}
                          {...field}
                          value={field.value ?? ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`attributes.${index}.value`}
                  render={({ field }) => (
                    <FormItem className='flex-1 space-y-2'>
                      <FormLabel htmlFor={`attributes.${index}.value`}>
                        {t('description')}
                      </FormLabel>
                      <FormControl>
                        <Input
                          id={`attributes.${index}.value`}
                          type='text'
                          maxLength='100'
                          autoComplete='off'
                          placeholder={t('attribute_value_placeholder')}
                          onChange={(e) => onEditAttribute(attribute.id, "description", e.target.value)}
                          {...field}
                          value={field.value ?? ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type='button'
                  variant='ghost'
                  size='icon'
                  onClick={() => {
                    onRemoveAttribute(attribute.id)
                  }}>
                  <LuTrash2 className='w-4 h-4' />
                </Button>
              </div>
            ))}
            <Button
              type='button'
              variant='outline'
              onClick={() => {
                onAddAttribute()
              }}>
              <LuPlus className='w-4 h-4 mr-2' />
              {t('add_attribute')}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}

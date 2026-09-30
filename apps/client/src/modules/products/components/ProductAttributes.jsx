import { useForm } from 'react-hook-form';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';
import { attributesSchema } from '../utils';
import { LuTrash2, LuPlus } from 'react-icons/lu';
import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import PropTypes from 'prop-types';
import { FIELD_LIMITS } from '@/config/fieldLimits';

/** Editable attribute input that mirrors changes to the parent state. */
function AttributeInputField({
  control,
  name,
  id,
  labelKey,
  placeholderKey,
  maxLength,
  onEditAttribute,
  index,
  fieldKey,
}) {
  const { t } = useTranslation();
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className="flex-1 space-y-2">
          <FormLabel htmlFor={id}>{t(labelKey)}*</FormLabel>
          <FormControl>
            <Input
              id={id}
              type="text"
              maxLength={maxLength}
              autoComplete="off"
              placeholder={t(placeholderKey)}
              {...field}
              onChange={(e) => {
                field.onChange(e.target.value); // Actualizar react-hook-form
                onEditAttribute(index, fieldKey, e.target.value); // Actualizar el estado manualmente
              }}
              value={field.value ?? ''}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

AttributeInputField.propTypes = {
  control: PropTypes.object.isRequired,
  name: PropTypes.string.isRequired,
  id: PropTypes.string.isRequired,
  labelKey: PropTypes.string.isRequired,
  placeholderKey: PropTypes.string.isRequired,
  maxLength: PropTypes.number.isRequired,
  onEditAttribute: PropTypes.func.isRequired,
  index: PropTypes.number.isRequired,
  fieldKey: PropTypes.string.isRequired,
};

/** One attribute row: name + description inputs and the remove button. */
function buildAttributeRow({
  form,
  attribute,
  index,
  onEditAttribute,
  onRemoveAttribute,
}) {
  return (
    <div key={index} className="flex items-end gap-4">
      {/* Nombre del atributo */}
      <AttributeInputField
        control={form.control}
        name={`attributes.${index}.name`}
        id={`attribute-name-${index}`}
        labelKey="attribute_name"
        placeholderKey="attribute_name_placeholder"
        maxLength={FIELD_LIMITS.productAttributes.name}
        onEditAttribute={onEditAttribute}
        index={index}
        fieldKey="name"
      />

      {/* Valor del atributo */}
      <AttributeInputField
        control={form.control}
        name={`attributes.${index}.description`}
        id={`attribute-description-${index}`}
        labelKey="description"
        placeholderKey="attribute_value_placeholder"
        maxLength={FIELD_LIMITS.productAttributes.description}
        onEditAttribute={onEditAttribute}
        index={index}
        fieldKey="description"
      />

      {/* Botón de eliminación */}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => onRemoveAttribute(index, attribute)}
      >
        <LuTrash2 className="w-4 h-4" />
      </Button>
    </div>
  );
}

/** Add / save buttons row. */
function buildAttributeButtons({ t, onAddAttribute }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 mt-5 md:justify-normal">
      <Button type="button" variant="success" onClick={onAddAttribute}>
        <LuPlus className="w-4 h-4 mr-2" />
        {t('add_attribute')}
      </Button>
      <Button type="submit" variant="info">
        {t('save')}
      </Button>
    </div>
  );
}

export const ProductAttributes = ({
  onRemoveAttribute,
  onAddAttribute,
  onEditAttribute,
  attributes,
  onSubmitFormAttributes,
}) => {
  const { t } = useTranslation();
  const form = useForm({
    resolver: zodResolver(attributesSchema),
    defaultValues: { attributes: attributes },
  });

  //Para actualizar el formulario con relacion al state
  useEffect(() => {
    form.reset({ attributes });
  }, [attributes, form]);

  const submitFormAttribute = (data) => {
    if (data.attributes.length === 0) return;
    onSubmitFormAttributes(data.attributes);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('product_attributes')}</CardTitle>
        <CardDescription>{t('add_custom_attributes')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Form {...form}>
          <form
            id="products-attributes-form"
            noValidate
            onSubmit={form.handleSubmit(submitFormAttribute)}
            className="flex flex-col flex-wrap gap-5"
          >
            <div className="space-y-4 overflow-y-auto max-h-80">
              {attributes.map((attribute, index) =>
                buildAttributeRow({
                  form,
                  attribute,
                  index,
                  onEditAttribute,
                  onRemoveAttribute,
                })
              )}
            </div>

            {/* Botón para agregar nuevo atributo */}
            {buildAttributeButtons({ t, onAddAttribute })}
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

ProductAttributes.propTypes = {
  onRemoveAttribute: PropTypes.func.isRequired,
  onAddAttribute: PropTypes.func.isRequired,
  onEditAttribute: PropTypes.func.isRequired,
  attributes: PropTypes.array.isRequired,
  onSubmitFormAttributes: PropTypes.func.isRequired,
};

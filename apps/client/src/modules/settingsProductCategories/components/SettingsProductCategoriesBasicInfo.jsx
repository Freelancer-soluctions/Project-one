import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { SettingsProductCategoriesSchema } from '../utils';
import { useTranslation } from 'react-i18next';
import { useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import { pickDirty } from '@/utils/pickDirty';
import { FIELD_LIMITS } from '@/config/fieldLimits';

/** Category input field (parametrized name/label/placeholder). */
function CategoryInputField({
  control,
  name,
  labelKey,
  placeholderKey,
  required = false,
}) {
  const { t } = useTranslation();
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel htmlFor={name}>
            {t(labelKey)}
            {required ? '*' : ''}
          </FormLabel>
          <FormControl>
            <Input
              id={name}
              type="text"
              name={name}
              maxLength={FIELD_LIMITS.productCategories[name]}
              autoComplete="off"
              placeholder={t(placeholderKey)}
              {...field}
              value={field.value ?? ''}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

CategoryInputField.propTypes = {
  control: PropTypes.object.isRequired,
  name: PropTypes.string.isRequired,
  labelKey: PropTypes.string.isRequired,
  placeholderKey: PropTypes.string.isRequired,
  required: PropTypes.bool,
};

/** Form action buttons: cancel, delete (edit only), save. */
function buildFormButtons({ t, id, handleDelete, onClose }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 mt-5 md:justify-normal">
      <Button type="button" variant="secondary" onClick={onClose}>
        {t('cancel')}
      </Button>
      {id && (
        <Button
          type="button"
          variant="destructive"
          onClick={() => {
            handleDelete(id);
          }}
        >
          {t('delete')}
        </Button>
      )}
      <Button type="submit" variant="info">
        {t('save')}
      </Button>
    </div>
  );
}

/**
 * Form state: reset from the selected row, dirty-field PATCH payloads
 * on edit.
 */
function useCategoryBasicInfoForm({ selectedRow, onSubmitCreateEdit }) {
  const form = useForm({
    resolver: zodResolver(SettingsProductCategoriesSchema),
    defaultValues: {
      description: '',
      code: '',
    },
  });
  const {
    formState: { dirtyFields },
  } = form;

  const id = useMemo(() => selectedRow?.id ?? null, [selectedRow?.id]);

  // Actualiza todos los valores del formulario al cambiar `selectedRow`
  useEffect(() => {
    if (selectedRow) {
      form.reset({
        ...selectedRow,
      });
    }
  }, [selectedRow, form]);

  const submitForm = (data) => {
    if (id) {
      // edit → send only changed fields (PATCH)
      const changes = pickDirty(data, dirtyFields);
      onSubmitCreateEdit(changes);
    } else {
      // create → send all fields (POST)
      onSubmitCreateEdit(data);
    }
  };

  return { form, id, submitForm };
}

export const SettingsProductCategoriesBasicInfo = ({
  onSubmitCreateEdit,
  onDelete,
  selectedRow,
  onClose,
}) => {
  const { t } = useTranslation();
  const { form, id, submitForm } = useCategoryBasicInfoForm({
    selectedRow,
    onSubmitCreateEdit,
  });

  const handleDelete = (id) => {
    onDelete(id);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('product_category_information')}</CardTitle>
        <CardDescription>
          {t('product_category_basic_information_msg')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Form {...form}>
          <form
            method="post"
            action=""
            id="product-categories-info-form"
            noValidate
            onSubmit={form.handleSubmit(submitForm)}
            className="flex flex-col flex-wrap gap-5"
          >
            <div className="grid grid-cols-1 gap-4 ">
              <div className="space-y-2">
                <CategoryInputField
                  control={form.control}
                  name="description"
                  labelKey="description"
                  placeholderKey="category_description_placeholder"
                  required
                />
                <CategoryInputField
                  control={form.control}
                  name="code"
                  labelKey="code"
                  placeholderKey="category_code_placeholder"
                  required
                />
              </div>
            </div>

            {buildFormButtons({ t, id, handleDelete, onClose })}
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

SettingsProductCategoriesBasicInfo.propTypes = {
  onSubmitCreateEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  selectedRow: PropTypes.object.isRequired,
  onClose: PropTypes.func.isRequired,
};

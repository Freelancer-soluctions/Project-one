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

export const SettingsProductCategoriesBasicInfo = ({
  onSubmitCreateEdit,
  onDelete,
  selectedRow,
  onClose,
}) => {
  const { t } = useTranslation();

  const form = useForm({
    resolver: zodResolver(SettingsProductCategoriesSchema),
    defaultValues: {
      description: '',
      code: '',
    },
  });

const id = useMemo(()=> selectedRow?.id ?? null, [selectedRow?.id])

  // Actualiza todos los valores del formulario al cambiar `selectedRow`
  useEffect(() => {
    if (selectedRow) {
      form.reset({
        ...selectedRow,
      });
    }
  }, [selectedRow, form]);

  const submitForm = (data) => {
    onSubmitCreateEdit(data);
  };

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
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => {
                    return (
                      <FormItem>
                        <FormLabel htmlFor="description">
                          {t('description')}*
                        </FormLabel>
                        <FormControl>
                          <Input
                            id="description"
                            type="text"
                            name="description"
                            maxLength={50}
                            autoComplete="off"
                            placeholder={t('category_description_placeholder')}
                            {...field}
                            value={field.value ?? ''}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />
                <FormField
                  control={form.control}
                  name="code"
                  render={({ field }) => {
                    return (
                      <FormItem>
                        <FormLabel htmlFor="code">{t('code')}*</FormLabel>
                        <FormControl>
                          <Input
                            id="code"
                            type="text"
                            name="code"
                            maxLength={3}
                            autoComplete="off"
                            placeholder={t('category_code_placeholder')}
                            {...field}
                            value={field.value ?? ''}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />
              </div>
            </div>
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

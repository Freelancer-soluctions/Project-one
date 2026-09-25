import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ProductsSchema, generateRandomBarcode } from '../utils';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useEffect, useMemo } from 'react';
import { pickDirty } from '@/utils/pickDirty';
import { LuBarcode } from 'react-icons/lu';
import PropTypes from 'prop-types';
import { FIELD_LIMITS } from '@/config/fieldLimits';

/** Text input field (parametrized name/label/placeholder/type). */
function ProductTextField({
  control,
  name,
  labelKey,
  placeholderKey,
  type = 'text',
  required = false,
  maxLength,
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
              type={type}
              name={name}
              maxLength={maxLength}
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

ProductTextField.propTypes = {
  control: PropTypes.object.isRequired,
  name: PropTypes.string.isRequired,
  labelKey: PropTypes.string.isRequired,
  placeholderKey: PropTypes.string.isRequired,
  type: PropTypes.string,
  required: PropTypes.bool,
  maxLength: PropTypes.number,
};

/** Numeric input field. */
function ProductNumberField({ control, name, labelKey, required = false }) {
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
              type="number"
              placeholder="0.00"
              name={name}
              autoComplete="off"
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

ProductNumberField.propTypes = {
  control: PropTypes.object.isRequired,
  name: PropTypes.string.isRequired,
  labelKey: PropTypes.string.isRequired,
  required: PropTypes.bool,
};

/**
 * Catalog select field: stores the full selected object, keyed by
 * `code` (category/provider/status).
 */
function ProductCatalogSelectField({
  control,
  name,
  labelKey,
  id,
  placeholderKey,
  dataCatalog,
  labelSelector,
  required = false,
}) {
  const { t } = useTranslation();
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel htmlFor={id}>
            {t(labelKey)}
            {required ? '*' : ''}
          </FormLabel>
          <Select
            onValueChange={(code) => {
              // Buscar el objeto completo por el `code`
              if (dataCatalog?.length > 0) {
                const selected = dataCatalog.find((item) => item.code === code);
                if (selected) {
                  field.onChange(selected); // Asignar el objeto completo
                }
              }
            }}
            value={field.value?.code}
          >
            <FormControl id={id}>
              <SelectTrigger>
                <SelectValue placeholder={t(placeholderKey)} />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {dataCatalog?.map((item, index) => (
                <SelectItem value={item.code} key={index}>
                  {labelSelector(item)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

ProductCatalogSelectField.propTypes = {
  control: PropTypes.object.isRequired,
  name: PropTypes.string.isRequired,
  labelKey: PropTypes.string.isRequired,
  id: PropTypes.string.isRequired,
  placeholderKey: PropTypes.string.isRequired,
  dataCatalog: PropTypes.array,
  labelSelector: PropTypes.func.isRequired,
  required: PropTypes.bool,
};

/** Description textarea field. */
function ProductDescriptionField({ control }) {
  const { t } = useTranslation();
  return (
    <FormField
      control={control}
      name="description"
      render={({ field }) => (
        <FormItem className="flex flex-col flex-auto col-span-2">
          <FormLabel htmlFor="description">{t('description')}</FormLabel>
          <FormControl>
            <Textarea
              id="description"
              placeholder={t('detailed_product_description_placeholder')}
              className="resize-none"
              autoComplete="off"
              maxLength={FIELD_LIMITS.products.description}
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

ProductDescriptionField.propTypes = {
  control: PropTypes.object.isRequired,
};

/** Barcode field with its generate button. */
function ProductBarcodeField({ control, onGenerateBarcode }) {
  const { t } = useTranslation();
  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <div className="flex-1">
          <FormField
            className="flex-initial"
            control={control}
            name="barcode"
            render={({ field }) => (
              <FormItem>
                <FormLabel htmlFor="barcode">{t('barcode')}</FormLabel>
                <FormControl>
                  <Input
                    id="barcode"
                    type="text"
                    name="barcode"
                    autoComplete="off"
                    maxLength={FIELD_LIMITS.products.barCode}
                    placeholder={t(
                      'generate_barcode_automatically_placeholder'
                    )}
                    {...field}
                    value={field.value ?? ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="space-y-2">
          <Button
            className="mt-8"
            type="button"
            variant="outline"
            onClick={onGenerateBarcode}
          >
            <LuBarcode className="w-4 h-4 mr-2" />
            {t('generate')}
          </Button>
        </div>
      </div>
    </div>
  );
}

ProductBarcodeField.propTypes = {
  control: PropTypes.object.isRequired,
  onGenerateBarcode: PropTypes.func.isRequired,
};

/** Name + sku row. */
function buildNameSkuRow({ form }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <div className="space-y-2">
        <ProductTextField
          control={form.control}
          name="name"
          labelKey="name"
          placeholderKey="enter_product_name_placeholder"
          maxLength={FIELD_LIMITS.products.name}
          required
        />
      </div>
      <div className="space-y-2">
        <ProductTextField
          control={form.control}
          name="sku"
          labelKey="sku"
          placeholderKey="enter_unique_product_code_placeholder"
          maxLength={FIELD_LIMITS.products.sku}
          required
        />
      </div>
    </div>
  );
}

/** Category / provider / status row. */
function buildCatalogRow({ form, dataCategory, dataProviders, datastatus }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <div className="space-y-2">
        <ProductCatalogSelectField
          control={form.control}
          name="category"
          labelKey="category"
          id="category"
          placeholderKey="select_category"
          dataCatalog={dataCategory}
          labelSelector={(item) => item.description}
          required
        />
      </div>

      <div className="space-y-2">
        <ProductCatalogSelectField
          control={form.control}
          name="provider"
          labelKey="provider"
          id="provider"
          placeholderKey="select_provider"
          dataCatalog={dataProviders}
          labelSelector={(item) => item.name}
          required
        />
      </div>

      <div className="space-x-2">
        <ProductCatalogSelectField
          control={form.control}
          name="status"
          labelKey="status"
          id="status"
          placeholderKey="select_status"
          dataCatalog={datastatus}
          labelSelector={(item) => item.description}
          required
        />
      </div>
    </div>
  );
}

/** Price + cost row. */
function buildPriceCostRow({ form }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <div className="space-y-2">
        <ProductNumberField
          control={form.control}
          name="price"
          labelKey="price"
          required
        />
      </div>
      <div className="space-y-2">
        <ProductNumberField
          control={form.control}
          name="cost"
          labelKey="cost"
          required
        />
      </div>
    </div>
  );
}

/** Form action buttons: cancel (back to home), delete (edit only), save. */
function buildFormButtons({ t, productId, handleDelete, handleCancel }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 mt-5 md:justify-normal">
      <Button type="button" variant="secondary" onClick={handleCancel}>
        {t('cancel')}
      </Button>
      {productId && (
        <Button
          type="button"
          variant="destructive"
          onClick={() => {
            handleDelete(productId);
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
 * Form state: reset from the selected row (catalog objects nested),
 * dirty-field PATCH payloads on edit.
 */
function useProductBasicInfoForm({ selectedRow, onSubmitCreateEdit }) {
  const form = useForm({
    resolver: zodResolver(ProductsSchema),
    defaultValues: {
      name: '',
      sku: '',
      description: '',
      barcode: '',
      price: '',
      cost: '',
      category: null,
      provider: null,
      status: null,
    },
  });
  const {
    formState: { dirtyFields },
  } = form;

  const productId = useMemo(() => selectedRow?.id ?? null, [selectedRow?.id]);

  // Actualiza todos los valores del formulario al cambiar `selectedRow`
  useEffect(() => {
    if (selectedRow?.id) {
      form.reset({
        ...selectedRow,
        status: {
          id: selectedRow.statusId,
          code: selectedRow.statusCode,
          description: selectedRow.statusDescription,
        },
        category: {
          id: selectedRow.categoryId,
          code: selectedRow.categoryCode,
          description: selectedRow.categoryDescription,
        },
        provider: {
          id: selectedRow.providerId,
          code: selectedRow.providerCode,
          description: selectedRow.providerDescription,
        },
      });
    } else {
      form.reset();
    }
  }, [selectedRow, form]);

  const handleGenerateBarcode = () => {
    const barcode = generateRandomBarcode(10);

    form.setValue('barcode', barcode, {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  const submitForm = (data) => {
    if (productId) {
      // edit → send only changed fields (PATCH)
      const changes = pickDirty(data, dirtyFields);
      onSubmitCreateEdit(changes);
    } else {
      // create → send all fields (POST)
      onSubmitCreateEdit(data);
    }
  };

  return { form, productId, handleGenerateBarcode, submitForm };
}

export const ProductBasicInfo = ({
  onSubmitCreateEdit,
  onDelete,
  dataCategory,
  dataProviders,
  datastatus,
  selectedRow,
}) => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const { form, productId, handleGenerateBarcode, submitForm } =
    useProductBasicInfoForm({ selectedRow, onSubmitCreateEdit });

  const handleDelete = (id) => {
    onDelete(id);
  };

  const handleCancel = () => {
    navigate('/home', { replace: true });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('product_information')}</CardTitle>
        <CardDescription>{t('product_basic_information_msg')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Form {...form}>
          <form
            method="post"
            action=""
            id="products-info-form"
            noValidate
            onSubmit={form.handleSubmit(submitForm)}
            className="flex flex-col flex-wrap gap-5"
          >
            {buildNameSkuRow({ form })}

            {buildCatalogRow({ form, dataCategory, dataProviders, datastatus })}

            {buildPriceCostRow({ form })}

            <div className="space-y-2">
              <ProductDescriptionField control={form.control} />
            </div>

            <ProductBarcodeField
              control={form.control}
              onGenerateBarcode={handleGenerateBarcode}
            />

            {buildFormButtons({ t, productId, handleDelete, handleCancel })}
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

ProductBasicInfo.propTypes = {
  onSubmitCreateEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  dataCategory: PropTypes.array,
  dataProviders: PropTypes.array,
  datastatus: PropTypes.array,
  selectedRow: PropTypes.object,
};

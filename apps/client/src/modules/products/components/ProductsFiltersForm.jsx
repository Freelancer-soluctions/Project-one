import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
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
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { LuPlus, LuSearch, LuEraser } from 'react-icons/lu';
import PropTypes from 'prop-types';
import { FIELD_LIMITS } from '@/config/fieldLimits';

/** Text filter field. */
function FilterTextField({ control }) {
  const { t } = useTranslation();
  return (
    <FormField
      control={control}
      name="name"
      render={({ field }) => (
        <FormItem className="flex flex-col flex-auto">
          <FormLabel htmlFor="name">{t('name')}</FormLabel>
          <FormControl>
            <Input
              id="name"
              name="description"
              placeholder={t('description_placeholder')}
              type="text"
              autoComplete="false"
              maxLength={FIELD_LIMITS.products.name}
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

FilterTextField.propTypes = {
  control: PropTypes.object.isRequired,
};

/**
 * Catalog select filter (stores the full object keyed by `code`,
 * like the dialogs' catalog selects).
 */
function FilterCatalogSelectField({
  control,
  name,
  labelKey,
  id,
  placeholderKey,
  dataCatalog,
  labelSelector,
}) {
  const { t } = useTranslation();
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className="flex flex-col flex-auto">
          <FormLabel htmlFor={id}>{t(labelKey)}</FormLabel>
          <Select onValueChange={field.onChange} value={field.value}>
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

FilterCatalogSelectField.propTypes = {
  control: PropTypes.object.isRequired,
  name: PropTypes.string.isRequired,
  labelKey: PropTypes.string.isRequired,
  id: PropTypes.string.isRequired,
  placeholderKey: PropTypes.string.isRequired,
  dataCatalog: PropTypes.array,
  labelSelector: PropTypes.func.isRequired,
};

/** Search / add / clear action buttons row. */
function buildFilterButtons({ t, handleAdd, handleResetFilter }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 mt-5 md:justify-normal">
      <Button
        type="submit"
        className="flex-1 md:flex-initial md:w-24"
        variant="info"
      >
        {t('search')}
        <LuSearch className="w-4 h-4 ml-auto opacity-50" />
      </Button>
      <Button
        type="button"
        className="flex-1 md:flex-initial md:w-24"
        variant="success"
        onClick={() => handleAdd()}
      >
        {t('add')} <LuPlus className="w-4 h-4 ml-auto opacity-50" />
      </Button>
      <Button
        type="button"
        className="flex-1 md:flex-initial md:w-24"
        variant="outline"
        onClick={() => handleResetFilter()}
      >
        {t('clear')} <LuEraser className="w-4 h-4 ml-auto opacity-50" />
      </Button>
    </div>
  );
}

export const ProductsFiltersForm = ({
  onSubmit,
  onOpenProductsForms,
  datastatus,
  dataCategory,
  dataProviders,
}) => {
  const { t } = useTranslation(); // Accede a las traducciones

  // Configura el formulario
  const formFilter = useForm({
    defaultValues: {
      name: '',
      category: '',
      type: '',
      status: '',
      providers: '',
    },
  });

  //form event
  const handleSubmitFilter = ({ name, category, type, status }) => {
    onSubmit({
      name,
      productCategoryCode: category.code,
      productTypeCode: type.code,
      statusCode: status.code,
    });
  };

  const handleAdd = () => {
    onOpenProductsForms();
  };

  const handleResetFilter = () => {
    formFilter.reset();
  };

  return (
    <>
      <Form {...formFilter}>
        <form
          method="post"
          action=""
          id="profile-info-form"
          noValidate
          onSubmit={formFilter.handleSubmit(handleSubmitFilter)}
          className="flex flex-col flex-wrap gap-5"
        >
          {/* inputs */}
          <div className="flex flex-wrap flex-1 gap-3">
            <FilterTextField control={formFilter.control} />

            <FilterCatalogSelectField
              control={formFilter.control}
              name="status"
              labelKey="status"
              id="status"
              placeholderKey="select_status"
              dataCatalog={datastatus}
              labelSelector={(item) => item.description}
            />

            <FilterCatalogSelectField
              control={formFilter.control}
              name="category"
              labelKey="category"
              id="category"
              placeholderKey="select_category"
              dataCatalog={dataCategory}
              labelSelector={(item) => item.description}
            />

            <FilterCatalogSelectField
              control={formFilter.control}
              name="providers"
              labelKey="providers"
              id="providers"
              placeholderKey="select_providers"
              dataCatalog={dataProviders}
              labelSelector={(item) => item.name}
            />
          </div>
          {/* buttons */}
          {buildFilterButtons({ t, handleAdd, handleResetFilter })}
        </form>
      </Form>
    </>
  );
};

ProductsFiltersForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  onOpenProductsForms: PropTypes.func.isRequired,
  datastatus: PropTypes.array,
  dataCategory: PropTypes.array,
  dataProviders: PropTypes.array,
};

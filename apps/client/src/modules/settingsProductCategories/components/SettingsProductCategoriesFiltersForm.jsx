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

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { LuPlus, LuSearch, LuEraser } from 'react-icons/lu';

import PropTypes from 'prop-types';
import { FIELD_LIMITS } from '@/config/fieldLimits';

/** Category text filter field (parametrized name/label/placeholder). */
function FilterCategoryField({ control, name, labelKey, placeholderKey }) {
  const { t } = useTranslation();
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className="flex flex-col flex-auto">
          <FormLabel htmlFor={name}>{t(labelKey)}</FormLabel>
          <FormControl>
            <Input
              id={name}
              name={name}
              placeholder={t(placeholderKey)}
              type="text"
              autoComplete="off"
              maxLength={FIELD_LIMITS.productCategories[name]}
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

FilterCategoryField.propTypes = {
  control: PropTypes.object.isRequired,
  name: PropTypes.string.isRequired,
  labelKey: PropTypes.string.isRequired,
  placeholderKey: PropTypes.string.isRequired,
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
        onClick={handleAdd}
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

export const SettingsProductCategoriesFiltersForm = ({ onSubmit, onAdd }) => {
  const { t } = useTranslation();
  const form = useForm({
    defaultValues: {
      description: '',
      code: '',
    },
  });

  const handleSubmit = (data) => {
    onSubmit(data);
  };

  const handleAdd = () => {
    onAdd();
  };

  const handleResetFilter = () => {
    form.reset();
  };

  return (
    <Form {...form}>
      <form
        method="post"
        action=""
        id="category-filters-form"
        noValidate
        onSubmit={form.handleSubmit(handleSubmit)}
        className="flex flex-col flex-wrap gap-5"
      >
        {/* inputs */}
        <div className="flex flex-wrap flex-1 gap-3">
          <FilterCategoryField
            control={form.control}
            name="description"
            labelKey="description"
            placeholderKey="category_description_placeholder"
          />

          <FilterCategoryField
            control={form.control}
            name="code"
            labelKey="code"
            placeholderKey="category_code_placeholder"
          />
        </div>
        {/* buttons */}
        {buildFilterButtons({ t, handleAdd, handleResetFilter })}
      </form>
    </Form>
  );
};

SettingsProductCategoriesFiltersForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  dataStatus: PropTypes.array,
  onAddDialog: PropTypes.func,
  onAdd: PropTypes.func,
};

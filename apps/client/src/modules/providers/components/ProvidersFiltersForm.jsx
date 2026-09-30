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

/** Parametrized text input for the provider filters. */
function FilterProviderTextField({ control, name, labelKey, placeholderKey }) {
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
              maxLength={FIELD_LIMITS.productProviders[name]}
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

FilterProviderTextField.propTypes = {
  control: PropTypes.object.isRequired,
  name: PropTypes.string.isRequired,
  labelKey: PropTypes.string.isRequired,
  placeholderKey: PropTypes.string.isRequired,
};

/** Boolean status select ('true'/'false' strings ↔ boolean). */
function FilterProviderStatusField({ control, dataStatus }) {
  const { t } = useTranslation();
  return (
    <FormField
      control={control}
      name="status"
      render={({ field }) => (
        <FormItem className="flex flex-col flex-auto">
          <FormLabel htmlFor="status">{t('status')}</FormLabel>
          <Select
            onValueChange={(value) => field.onChange(value === 'true')}
            value={field.value?.toString()} // Asegura que el valor sea string
          >
            <FormControl id="status">
              <SelectTrigger>
                <SelectValue placeholder={t('select_status')} />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {dataStatus.map((item, index) => (
                <SelectItem value={item.value.toString()} key={index}>
                  {item.description}
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

FilterProviderStatusField.propTypes = {
  control: PropTypes.object.isRequired,
  dataStatus: PropTypes.array.isRequired,
};

/** Filter inputs row: name and status. */
const buildFilterFields = ({ control, dataStatus }) => (
  <div className="flex flex-wrap flex-1 gap-3">
    <FilterProviderTextField
      control={control}
      name="name"
      labelKey="name"
      placeholderKey="provider_name_placeholder"
    />
    <FilterProviderStatusField control={control} dataStatus={dataStatus} />
  </div>
);

/** Action buttons row: search, add and clear. */
const buildFilterButtons = ({ t, onAdd, onReset }) => (
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
      onClick={onAdd}
    >
      {t('add')} <LuPlus className="w-4 h-4 ml-auto opacity-50" />
    </Button>
    <Button
      type="button"
      className="flex-1 md:flex-initial md:w-24"
      variant="outline"
      onClick={onReset}
    >
      {t('clear')} <LuEraser className="w-4 h-4 ml-auto opacity-50" />
    </Button>
  </div>
);

export const ProvidersFiltersForm = ({ onSubmit, dataStatus, onAddDialog }) => {
  const { t } = useTranslation();
  const form = useForm({
    defaultValues: {
      name: '',
      status: true,
    },
  });

  const handleAdd = () => {
    onAddDialog();
  };

  const handleResetFilter = () => {
    form.reset();
  };

  return (
    <Form {...form}>
      <form
        method="post"
        action=""
        id="provider-filters-form"
        noValidate
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col flex-wrap gap-5"
      >
        {/* inputs */}
        {buildFilterFields({ control: form.control, dataStatus })}
        {/* buttons */}
        {buildFilterButtons({
          t,
          onAdd: handleAdd,
          onReset: () => handleResetFilter(),
        })}
      </form>
    </Form>
  );
};

ProvidersFiltersForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  dataStatus: PropTypes.array,
  onAddDialog: PropTypes.func,
};

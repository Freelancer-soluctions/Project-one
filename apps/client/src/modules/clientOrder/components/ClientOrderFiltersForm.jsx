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
import { zodResolver } from '@hookform/resolvers/zod';

/** Parametrized text input for the client order filters. */
const FilterClientOrderField = ({
  control,
  name,
  label,
  placeholder,
  type,
}) => (
  <FormField
    control={control}
    name={name}
    render={({ field }) => (
      <FormItem className="flex flex-col flex-auto">
        <FormLabel htmlFor={name}>{label}</FormLabel>
        <FormControl>
          <Input
            id={name}
            name={name}
            placeholder={placeholder}
            type={type}
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

FilterClientOrderField.propTypes = {
  control: PropTypes.object.isRequired,
  name: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  placeholder: PropTypes.string.isRequired,
  type: PropTypes.string.isRequired,
};

/** Filter inputs row: clientId and status. */
const buildFilterFields = ({ control, t }) => (
  <div className="flex flex-wrap flex-1 gap-3">
    <FilterClientOrderField
      control={control}
      name="clientId"
      label={t('clientId')}
      placeholder={t('clientOrder_clientId_placeholder')}
      type="number"
    />
    <FilterClientOrderField
      control={control}
      name="status"
      label={t('status')}
      placeholder={t('clientOrder_status_placeholder')}
      type="text"
    />
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

export const ClientOrderFiltersForm = ({ onSubmit, onAddDialog }) => {
  const { t } = useTranslation();
  const form = useForm({
    resolver: zodResolver(),
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
        id="clientOrder-filters-form"
        noValidate
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col flex-wrap gap-5"
      >
        {buildFilterFields({ control: form.control, t })}
        {buildFilterButtons({
          t,
          onAdd: handleAdd,
          onReset: () => handleResetFilter(),
        })}
      </form>
    </Form>
  );
};

ClientOrderFiltersForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  onAddDialog: PropTypes.func.isRequired,
};

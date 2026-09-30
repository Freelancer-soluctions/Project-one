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
import { LuSearch, LuEraser } from 'react-icons/lu';
import PropTypes from 'prop-types';
import { UsersFiltersSchema } from '../utils';
import { zodResolver } from '@hookform/resolvers/zod';
import { FIELD_LIMITS } from '@/config/fieldLimits';

/** Text filter field (parametrized name/label/placeholder/type). */
function FilterTextField({ control, name, labelKey, placeholderKey, type }) {
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
              type={type}
              autoComplete="off"
              maxLength={FIELD_LIMITS.users[name]}
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
  name: PropTypes.string.isRequired,
  labelKey: PropTypes.string.isRequired,
  placeholderKey: PropTypes.string.isRequired,
  type: PropTypes.string,
};

/** Status select filter fed from the users-status catalog. */
function FilterStatusSelectField({ control, dataStatus }) {
  const { t } = useTranslation();
  return (
    <FormField
      control={control}
      name="status"
      render={({ field }) => (
        <FormItem className="flex flex-col flex-auto">
          <FormLabel htmlFor="status">{t('status')}</FormLabel>
          <Select onValueChange={field.onChange} value={field.value}>
            <FormControl id="status">
              <SelectTrigger>
                <SelectValue placeholder={t('select_status')} />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {dataStatus?.data.map((item, index) => (
                <SelectItem value={item.code.toString()} key={index}>
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

FilterStatusSelectField.propTypes = {
  control: PropTypes.object.isRequired,
  dataStatus: PropTypes.object.isRequired,
};

/** Search / clear action buttons row (users filters have no add). */
function buildFilterButtons({ t, handleResetFilter }) {
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
        variant="outline"
        onClick={handleResetFilter}
      >
        {t('clear')} <LuEraser className="w-4 h-4 ml-auto opacity-50" />
      </Button>
    </div>
  );
}

export const UsersFiltersForm = ({ onSubmit, dataStatus }) => {
  const { t } = useTranslation();
  const form = useForm({
    resolver: zodResolver(UsersFiltersSchema),
    defaultValues: {
      name: '',
      status: '',
    },
  });

  const handleSubmit = (data) => {
    onSubmit(data);
  };

  const handleResetFilter = () => {
    form.reset();
  };

  return (
    <Form {...form}>
      <form
        method="post"
        action=""
        id="user-filters-form"
        noValidate
        onSubmit={form.handleSubmit(handleSubmit)}
        className="flex flex-col flex-wrap gap-5"
      >
        {/* inputs */}
        <div className="flex flex-wrap flex-1 gap-3">
          <FilterTextField
            control={form.control}
            name="name"
            labelKey="name"
            placeholderKey="user_name_placeholder"
            type="text"
          />

          <FilterTextField
            control={form.control}
            name="email"
            labelKey="email"
            placeholderKey="user_email_placeholder"
            type="email"
          />

          <FilterStatusSelectField
            control={form.control}
            dataStatus={dataStatus}
          />
        </div>
        {/* buttons */}
        {buildFilterButtons({ t, handleResetFilter })}
      </form>
    </Form>
  );
};

UsersFiltersForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  dataStatus: PropTypes.object.isRequired,
};

import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { zodResolver } from '@hookform/resolvers/zod';
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
import { EmployeeCatalogFiltersSchema } from '../utils';
import { FIELD_LIMITS } from '@/config/fieldLimits';

/** Text filter field (code / name). */
function CatalogFilterTextField({ control, name, labelKey }) {
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
              placeholder={t(`catalog_${name}_placeholder`)}
              type="text"
              autoComplete="off"
              maxLength={FIELD_LIMITS.employeeCatalogs[name]}
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

CatalogFilterTextField.propTypes = {
  control: PropTypes.object.isRequired,
  name: PropTypes.string.isRequired,
  labelKey: PropTypes.string.isRequired,
};

/** Status filter: all / active / inactive. */
function CatalogStatusFilterField({ control }) {
  const { t } = useTranslation();
  return (
    <FormField
      control={control}
      name="active"
      render={({ field }) => (
        <FormItem className="flex flex-col flex-auto">
          <FormLabel htmlFor="active">{t('status')}</FormLabel>
          <Select onValueChange={field.onChange} value={field.value ?? 'all'}>
            <FormControl>
              <SelectTrigger id="active" className="w-full">
                <SelectValue />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              <SelectItem value="all">{t('all_statuses')}</SelectItem>
              <SelectItem value="true">{t('active')}</SelectItem>
              <SelectItem value="false">{t('inactive')}</SelectItem>
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

CatalogStatusFilterField.propTypes = {
  control: PropTypes.object.isRequired,
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
        onClick={handleResetFilter}
      >
        {t('clear')} <LuEraser className="w-4 h-4 ml-auto opacity-50" />
      </Button>
    </div>
  );
}

export const EmployeeCatalogFiltersForm = ({ onSubmit, onAdd }) => {
  const { t } = useTranslation();
  const form = useForm({
    resolver: zodResolver(EmployeeCatalogFiltersSchema),
    defaultValues: {
      code: '',
      name: '',
      active: 'all',
    },
  });

  const handleSubmit = (data) => {
    onSubmit({
      code: data.code || undefined,
      name: data.name || undefined,
      active: data.active === 'all' ? undefined : data.active === 'true',
    });
  };

  return (
    <Form {...form}>
      <form
        method="post"
        action=""
        id="employee-catalog-filters-form"
        noValidate
        onSubmit={form.handleSubmit(handleSubmit)}
        className="flex flex-col flex-wrap gap-5"
      >
        <div className="flex flex-wrap flex-1 gap-3">
          <CatalogFilterTextField
            control={form.control}
            name="code"
            labelKey="code"
          />
          <CatalogFilterTextField
            control={form.control}
            name="name"
            labelKey="name"
          />
          <CatalogStatusFilterField control={form.control} />
        </div>
        {buildFilterButtons({
          t,
          handleAdd: onAdd,
          handleResetFilter: () => form.reset(),
        })}
      </form>
    </Form>
  );
};

EmployeeCatalogFiltersForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  onAdd: PropTypes.func.isRequired,
};

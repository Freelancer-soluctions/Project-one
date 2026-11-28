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
import { zodResolver } from '@hookform/resolvers/zod';
import { EmployeeFiltersSchema } from '../utils';
import { FIELD_LIMITS } from '@/config/fieldLimits';
import {
  useGetDepartmentOptionsQuery,
  useGetPositionOptionsQuery,
} from '../api/employeesApi';

/** Text filter field (parametrized name/label/placeholder). */
function FilterTextField({ control, name, labelKey, placeholderKey }) {
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
              maxLength={FIELD_LIMITS.employees[name] ?? undefined}
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
};

/** Catalog filter select; the "all" option clears the filter. */
function FilterCatalogSelectField({
  control,
  name,
  labelKey,
  allLabelKey,
  items,
}) {
  const { t } = useTranslation();
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className="flex flex-col flex-auto">
          <FormLabel htmlFor={name}>{t(labelKey)}</FormLabel>
          <Select
            onValueChange={(value) =>
              field.onChange(value === 'all' ? undefined : value)
            }
            value={field.value ?? 'all'}
          >
            <FormControl>
              <SelectTrigger id={name} className="w-full">
                <SelectValue />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              <SelectItem value="all">{t(allLabelKey)}</SelectItem>
              {items.map((item) => (
                <SelectItem key={item.id} value={String(item.id)}>
                  {item.name}
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
  allLabelKey: PropTypes.string.isRequired,
  items: PropTypes.array.isRequired,
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

export const EmployeesFiltersForm = ({ onSubmit, onAddDialog }) => {
  const { t } = useTranslation();
  const form = useForm({
    resolver: zodResolver(EmployeeFiltersSchema),
    defaultValues: {
      name: '',
      dni: '',
    },
  });

  const { data: positionsData } = useGetPositionOptionsQuery();
  const { data: departmentsData } = useGetDepartmentOptionsQuery();
  const positions = positionsData?.data?.dataList ?? [];
  const departments = departmentsData?.data?.dataList ?? [];

  const handleSubmit = (data) => {
    onSubmit(data);
  };

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
        id="employee-filters-form"
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
            placeholderKey="employee_name_placeholder"
          />
          <FilterTextField
            control={form.control}
            name="email"
            labelKey="email"
            placeholderKey="employee_email_placeholder"
          />
          <FilterTextField
            control={form.control}
            name="dni"
            labelKey="dni"
            placeholderKey="dni_placeholder"
          />
          <FilterCatalogSelectField
            control={form.control}
            name="positionId"
            labelKey="position"
            allLabelKey="all_positions"
            items={positions}
          />
          <FilterCatalogSelectField
            control={form.control}
            name="departmentId"
            labelKey="department"
            allLabelKey="all_departments"
            items={departments}
          />
        </div>
        {/* buttons */}
        {buildFilterButtons({ t, handleAdd, handleResetFilter })}
      </form>
    </Form>
  );
};

EmployeesFiltersForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  onAddDialog: PropTypes.func.isRequired,
};

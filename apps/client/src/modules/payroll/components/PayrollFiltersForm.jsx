import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import PropTypes from 'prop-types';
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
import { Input } from '@/components/ui/input'; // Using Input for Year filter
import { Button } from '@/components/ui/button';
import { LuPlus, LuSearch, LuEraser } from 'react-icons/lu';
import { months } from '../utils';

const EMPTY_FILTERS = {
  employeeId: '',
  month: '',
  year: '',
};

/** Employee select filter. */
function FilterEmployeeSelectField({ control, dataEmployees }) {
  const { t } = useTranslation();
  return (
    <FormField
      control={control}
      name="employeeId"
      render={({ field }) => (
        <FormItem className="flex flex-col flex-auto">
          <FormLabel>{t('employee')}</FormLabel>
          <Select
            onValueChange={field.onChange}
            value={field.value?.toString() ?? ''}
          >
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder={t('select_employee_placeholder')} />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {dataEmployees.map((employee) => (
                <SelectItem key={employee.id} value={employee.id.toString()}>
                  {`${employee.name} ${employee.lastName}`}
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

FilterEmployeeSelectField.propTypes = {
  control: PropTypes.object.isRequired,
  dataEmployees: PropTypes.array.isRequired,
};

/** Month select filter. */
function FilterMonthSelectField({ control }) {
  const { t } = useTranslation();
  return (
    <FormField
      control={control}
      name="month"
      render={({ field }) => (
        <FormItem className="flex flex-col flex-auto">
          <FormLabel>{t('month')}</FormLabel>
          <Select
            onValueChange={field.onChange}
            value={field.value?.toString() ?? ''}
          >
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder={t('select_month_placeholder')} />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {months.map((month) => (
                <SelectItem key={month.value} value={month.value}>
                  {month.label}
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

FilterMonthSelectField.propTypes = {
  control: PropTypes.object.isRequired,
};

/** Year numeric input filter. */
function FilterYearField({ control }) {
  const { t } = useTranslation();
  return (
    <FormField
      control={control}
      name="year"
      render={({ field }) => (
        <FormItem className="flex flex-col flex-auto">
          <FormLabel htmlFor="year">{t('year')}</FormLabel>
          <FormControl>
            <Input
              id="year"
              name="year"
              placeholder={t('year_placeholder')}
              type="number"
              min="2000"
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

FilterYearField.propTypes = {
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

/** Normalizes filter values: empty strings become undefined. */
const toFilterParams = (data) => ({
  employeeId: data.employeeId || undefined,
  month: data.month ? Number(data.month) : undefined,
  year: data.year ? Number(data.year) : undefined,
});

export const PayrollFiltersForm = ({
  onSubmit,
  onAddDialog,
  dataEmployees,
}) => {
  const { t } = useTranslation();

  const form = useForm({
    defaultValues: EMPTY_FILTERS,
  });

  const handleSubmit = (data) => {
    onSubmit(toFilterParams(data));
  };

  const handleAdd = () => {
    onAddDialog();
  };

  const handleResetFilter = () => {
    form.reset(EMPTY_FILTERS);
    onSubmit({}); // Submit empty filters to reset
  };

  return (
    <Form {...form}>
      <form
        method="get" // Use GET for filtering
        action=""
        id="payroll-filters-form"
        noValidate
        onSubmit={form.handleSubmit(handleSubmit)}
        className="flex flex-col flex-wrap gap-5"
      >
        {/* inputs */}
        <div className="flex flex-wrap flex-1 gap-3">
          <FilterEmployeeSelectField
            control={form.control}
            dataEmployees={dataEmployees}
          />
          <FilterMonthSelectField control={form.control} />
          <FilterYearField control={form.control} />
        </div>
        {/* buttons */}
        {buildFilterButtons({ t, handleAdd, handleResetFilter })}
      </form>
    </Form>
  );
};

PayrollFiltersForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  onAddDialog: PropTypes.func,
  dataEmployees: PropTypes.array.isRequired, // Ensure dataEmployees is passed as prop
};

import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import PropTypes from 'prop-types';
import { PERMISSION_TYPES, PERMISSION_STATUS } from '../utils';

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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { CalendarIcon } from '@radix-ui/react-icons';
import { LuPlus, LuSearch, LuEraser } from 'react-icons/lu';

const EMPTY_FILTERS = {
  employeeId: '',
  type: '',
  status: '',
  fromDate: null,
  toDate: null,
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

/** Type select filter. */
function FilterTypeSelectField({ control }) {
  const { t } = useTranslation();
  return (
    <FormField
      control={control}
      name="type"
      render={({ field }) => (
        <FormItem className="flex flex-col flex-auto">
          <FormLabel>{t('type')}</FormLabel>
          <Select onValueChange={field.onChange} value={field.value ?? ''}>
            <FormControl>
              <SelectTrigger>
                <SelectValue
                  placeholder={t('select_permission_type_placeholder')}
                />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {PERMISSION_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {t(`permission_type.${type}`)} {/* Assumes translations */}
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

FilterTypeSelectField.propTypes = {
  control: PropTypes.object.isRequired,
};

/** Status select filter. */
function FilterStatusSelectField({ control }) {
  const { t } = useTranslation();
  return (
    <FormField
      control={control}
      name="status"
      render={({ field }) => (
        <FormItem className="flex flex-col flex-auto">
          <FormLabel>{t('status')}</FormLabel>
          <Select onValueChange={field.onChange} value={field.value ?? ''}>
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder={t('select_status')} />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {PERMISSION_STATUS.map((status) => (
                <SelectItem key={status} value={status}>
                  {t(`status.${status}`)}
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
};

/**
 * Date-range filter field. `toDate` disables dates before the chosen
 * `fromDate`.
 */
function FilterDateField({ control, form, name, labelKey }) {
  const { t } = useTranslation();
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className="flex flex-col flex-auto">
          <FormLabel>{t(labelKey)}</FormLabel>
          <Popover>
            <PopoverTrigger asChild>
              <FormControl>
                <Button
                  variant={'outline'}
                  className={cn(
                    'w-full pl-3 text-left font-normal',
                    !field.value && 'text-muted-foreground'
                  )}
                >
                  {field.value ? (
                    format(field.value, 'PPP')
                  ) : (
                    <span>{t('pick_date')}</span>
                  )}
                  <CalendarIcon className="w-4 h-4 ml-auto opacity-50" />
                </Button>
              </FormControl>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={field.value}
                onSelect={field.onChange}
                disabled={(date) =>
                  date > new Date() ||
                  date < new Date('1900-01-01') ||
                  (name === 'toDate' &&
                    form.getValues('fromDate') &&
                    date < form.getValues('fromDate'))
                }
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

FilterDateField.propTypes = {
  control: PropTypes.object.isRequired,
  form: PropTypes.object.isRequired,
  name: PropTypes.string.isRequired,
  labelKey: PropTypes.string.isRequired,
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
  type: data.type || undefined,
  status: data.status || undefined,
  fromDate: data.fromDate ? format(data.fromDate, 'yyyy-MM-dd') : undefined,
  toDate: data.toDate ? format(data.toDate, 'yyyy-MM-dd') : undefined,
});

export const PermissionFiltersForm = ({
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
        method="get"
        action=""
        id="permission-filters-form"
        noValidate
        onSubmit={form.handleSubmit(handleSubmit)}
        className="flex flex-col flex-wrap gap-5"
      >
        {/* inputs - Using 5 columns for filters */}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
          <FilterEmployeeSelectField
            control={form.control}
            dataEmployees={dataEmployees}
          />
          <FilterTypeSelectField control={form.control} />
          <FilterStatusSelectField control={form.control} />
          <FilterDateField
            control={form.control}
            form={form}
            name="fromDate"
            labelKey="from_date"
          />
          <FilterDateField
            control={form.control}
            form={form}
            name="toDate"
            labelKey="to_date"
          />
        </div>
        {/* buttons */}
        {buildFilterButtons({ t, handleAdd, handleResetFilter })}
      </form>
    </Form>
  );
};

PermissionFiltersForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  onAddDialog: PropTypes.func,
  dataEmployees: PropTypes.array.isRequired,
};

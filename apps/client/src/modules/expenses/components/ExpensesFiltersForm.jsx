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
} from '@/components/ui/select'; // Added for status filter
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { LuPlus, LuSearch, LuEraser } from 'react-icons/lu';
import PropTypes from 'prop-types';
import { ExpensesFiltersSchema, expenseCategories } from '../utils'; // Changed from ClientsFiltersSchema
import { zodResolver } from '@hookform/resolvers/zod';
import { FIELD_LIMITS } from '@/config/fieldLimits';

const EMPTY_FILTERS = {
  description: '',
  category: '',
};

/** Description text filter. */
function FilterDescriptionField({ control }) {
  const { t } = useTranslation();
  return (
    <FormField
      control={control}
      name="description"
      render={({ field }) => (
        <FormItem>
          <FormLabel htmlFor="description">{t('description')}</FormLabel>
          <FormControl>
            <Input
              id="description"
              name="description"
              placeholder={t('description_placeholder')}
              type="text"
              autoComplete="off"
              maxLength={FIELD_LIMITS.expenses.description}
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

FilterDescriptionField.propTypes = {
  control: PropTypes.object.isRequired,
};

/** Category select filter fed from the expense categories enum. */
function FilterCategoryField({ control }) {
  const { t } = useTranslation();
  return (
    <FormField
      control={control}
      name="category"
      render={({ field }) => (
        <FormItem>
          <FormLabel htmlFor="category">{t('category')}</FormLabel>
          <Select onValueChange={field.onChange} value={field.value}>
            <FormControl>
              <SelectTrigger id="category">
                <SelectValue placeholder={t('select_category')} />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {expenseCategories.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {t(cat.labelKey)}
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

FilterCategoryField.propTypes = {
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

export const ExpensesFiltersForm = ({ onSubmit, onAddDialog }) => {
  // Renamed
  const { t } = useTranslation();
  const form = useForm({
    resolver: zodResolver(ExpensesFiltersSchema), // Changed schema
    defaultValues: EMPTY_FILTERS, // Added default values for new filter fields
  });

  const handleSubmit = (data) => {
    onSubmit(data);
  };

  const handleAdd = () => {
    onAddDialog();
  };

  const handleResetFilter = () => {
    form.reset(EMPTY_FILTERS); // Reset to defined defaults
    onSubmit({}); // Submit empty object to clear filters in parent
  };

  return (
    <Form {...form}>
      <form
        method="post"
        action=""
        id="expense-filters-form"
        noValidate
        onSubmit={form.handleSubmit(handleSubmit)}
        className="flex flex-col flex-wrap gap-5"
      >
        {/* inputs */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FilterDescriptionField control={form.control} />

          <FilterCategoryField control={form.control} />
        </div>
        {/* buttons */}
        {buildFilterButtons({ t, handleAdd, handleResetFilter })}
      </form>
    </Form>
  );
};

ExpensesFiltersForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  onAddDialog: PropTypes.func.isRequired,
};

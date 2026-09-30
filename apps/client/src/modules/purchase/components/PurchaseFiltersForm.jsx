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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { LuPlus, LuSearch, LuEraser, LuCalendarDays } from 'react-icons/lu';
import PropTypes from 'prop-types';
import { Calendar } from '@/components/ui/calendar';
import { format, formatISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { PurchaseFiltersSchema } from '../utils';

/** Provider select filter. */
function FilterProviderSelectField({ control, providers }) {
  const { t } = useTranslation();
  return (
    <FormField
      control={control}
      name="providerId"
      render={({ field }) => (
        <FormItem className="flex flex-col flex-auto">
          <FormLabel>{t('provider')}</FormLabel>
          <Select onValueChange={field.onChange} defaultValue={field.value}>
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder={t('select_provider')} />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {providers?.map((provider) => (
                <SelectItem key={provider.id} value={provider.id.toString()}>
                  {provider.name}
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

FilterProviderSelectField.propTypes = {
  control: PropTypes.object.isRequired,
  providers: PropTypes.array,
};

/** Date filter field with the calendar-days icon. */
function FilterDateField({ control, name, labelKey }) {
  const { t } = useTranslation();
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className="flex flex-col flex-auto">
          <FormLabel htmlFor={name}>{t(labelKey)}</FormLabel>
          <Popover>
            <PopoverTrigger asChild>
              <FormControl>
                <Button
                  id={name}
                  variant={'outline'}
                  className={cn(
                    'pl-3 text-left font-normal',
                    !field.value && 'text-muted-foreground'
                  )}
                >
                  {field.value ? (
                    format(field.value, 'PPP')
                  ) : (
                    <span>{t('pick_date')}</span>
                  )}
                  <LuCalendarDays className="w-4 h-4 ml-auto opacity-50" />
                </Button>
              </FormControl>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={field.value}
                onSelect={field.onChange}
                disabled={(date) => date < new Date('1900-01-01')}
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
  name: PropTypes.string.isRequired,
  labelKey: PropTypes.string.isRequired,
};

/** Numeric total-range filter field (min/max). */
function FilterTotalField({ control, name, labelKey, placeholderKey }) {
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
              type="number"
              step="0.01"
              min="0"
              placeholder={t(placeholderKey)}
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
}

FilterTotalField.propTypes = {
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

export const PurchaseFiltersForm = ({ onSubmit, onAddDialog, providers }) => {
  const { t } = useTranslation();

  const form = useForm({
    resolver: zodResolver(PurchaseFiltersSchema),
    defaultValues: {
      providerId: '',
      fromDate: '',
      toDate: '',
      minTotal: '',
      maxTotal: '',
    },
  });

  const handleSubmit = ({
    providerId,
    fromDate,
    toDate,
    minTotal,
    maxTotal,
  }) => {
    const fDate = fromDate && formatISO(new Date(fromDate), 'yyyy-MM-dd');
    const tDate = toDate && formatISO(new Date(toDate), 'yyyy-MM-dd');

    onSubmit({ providerId, fDate, tDate, minTotal, maxTotal });
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
        id="purchase-filters-form"
        noValidate
        onSubmit={form.handleSubmit(handleSubmit)}
        className="flex flex-col flex-wrap gap-5"
      >
        {/* inputs */}
        <div className="flex flex-wrap flex-1 gap-3">
          <FilterProviderSelectField
            control={form.control}
            providers={providers}
          />

          <FilterDateField
            control={form.control}
            name="fromDate"
            labelKey="from_date"
          />

          <FilterDateField
            control={form.control}
            name="toDate"
            labelKey="to_date"
          />

          <FilterTotalField
            control={form.control}
            name="minTotal"
            labelKey="min_total"
            placeholderKey="min_total_placeholder"
          />

          <FilterTotalField
            control={form.control}
            name="maxTotal"
            labelKey="max_total"
            placeholderKey="max_total_placeholder"
          />
        </div>

        {/* buttons */}
        {buildFilterButtons({ t, handleAdd, handleResetFilter })}
      </form>
    </Form>
  );
};

PurchaseFiltersForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  onAddDialog: PropTypes.func.isRequired,
  providers: PropTypes.array.isRequired,
};

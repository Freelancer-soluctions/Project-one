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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { LuPlus, LuCalendarDays, LuSearch, LuEraser } from 'react-icons/lu';

import { Calendar } from '@/components/ui/calendar';
import { format, formatISO } from 'date-fns';
import { cn } from '@/lib/utils';
import PropTypes from 'prop-types';
import { zodResolver } from '@hookform/resolvers/zod';
import { NewsFiltersSchema } from '../utils';
import { FIELD_LIMITS } from '@/config/fieldLimits';

/** Free-text description filter. */
function FilterDescriptionField({ control }) {
  const { t } = useTranslation();
  return (
    <FormField
      control={control}
      name="description"
      render={({ field }) => (
        <FormItem className="flex flex-col flex-auto">
          <FormLabel htmlFor="description">{t('description')}</FormLabel>
          <FormControl>
            <Input
              id="description"
              name="description"
              placeholder={t('description_placeholder')}
              type="text"
              autoComplete="false"
              maxLength={FIELD_LIMITS.news.description}
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

/** Popover date-picker filter (used for from/to dates). */
function FilterDateField({ control, name, label }) {
  const { t } = useTranslation();
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className="flex flex-col flex-auto">
          <FormLabel htmlFor={name}>{t(label)}</FormLabel>
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
  label: PropTypes.string.isRequired,
};

/** Status select filter. */
function FilterStatusField({ control, datastatus }) {
  const { t } = useTranslation();
  return (
    <FormField
      control={control}
      name="statusNews"
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
              {datastatus?.data.map((item, index) => (
                <SelectItem value={item.code} key={index}>
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

FilterStatusField.propTypes = {
  control: PropTypes.object.isRequired,
  datastatus: PropTypes.object,
};

/** Search / add / clear action buttons row. */
function buildFilterButtons({ t, handleAddDialog, handleResetFilter }) {
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
        onClick={() => handleAddDialog()}
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

export const NewsFiltersForm = ({
  onSubmit,
  setActionDialog,
  setOpenDialog,
  datastatus,
}) => {
  const { t } = useTranslation(); // Accede a las traducciones
  // Configura el formulario
  const formFilter = useForm({
    resolver: zodResolver(NewsFiltersSchema),
    defaultValues: {
      description: '',
      fdate: '',
      tdate: '',
      statusNews: '',
    },
  });
  const { control } = formFilter;

  //form event
  const onSubmitFilter = ({
    description,
    fdate,
    tdate,
    statusNews: statusCode,
  }) => {
    const fromDate = fdate && formatISO(new Date(fdate), 'yyyy-MM-dd');
    const toDate = tdate && formatISO(new Date(tdate), 'yyyy-MM-dd');

    onSubmit({ description, fromDate, toDate, statusCode });
  };

  const handleAddDialog = () => {
    setActionDialog(t('add_new'));
    setOpenDialog(true);
  };

  const handleResetFilter = () => {
    formFilter.reset();
  };

  return (
    <Form {...formFilter}>
      <form
        method="post"
        action=""
        id="profile-info-form"
        noValidate
        onSubmit={formFilter.handleSubmit(onSubmitFilter)}
        className="flex flex-col flex-wrap gap-5"
      >
        {/* inputs */}
        <div className="flex flex-wrap flex-1 gap-3">
          <FilterDescriptionField control={control} />
          <FilterDateField control={control} name="fdate" label="from_date" />
          <FilterDateField control={control} name="tdate" label="to_date" />
          <FilterStatusField control={control} datastatus={datastatus} />
        </div>
        {/* buttons */}
        {buildFilterButtons({ t, handleAddDialog, handleResetFilter })}
      </form>
    </Form>
  );
};

NewsFiltersForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  setActionDialog: PropTypes.func,
  setOpenDialog: PropTypes.func,
  datastatus: PropTypes.object,
};

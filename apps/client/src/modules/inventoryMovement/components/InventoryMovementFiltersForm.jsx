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
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import PropTypes from 'prop-types';
import { movementTypes } from '../utils';
import { LuCalendarDays, LuSearch, LuPlus, LuEraser } from 'react-icons/lu';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { format } from 'date-fns';

/** Entity select filter (products/warehouses keyed by id). */
function FilterEntitySelectField({
  control,
  name,
  labelKey,
  id,
  placeholderKey,
  dataItems,
}) {
  const { t } = useTranslation();
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className="flex flex-col flex-auto">
          <FormLabel htmlFor={id}>{t(labelKey)}</FormLabel>
          <Select
            onValueChange={field.onChange}
            value={field.value?.toString()} // Asegura que el valor sea string
          >
            <FormControl id={id}>
              <SelectTrigger>
                <SelectValue placeholder={t(placeholderKey)} />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {dataItems.map((item, index) => (
                <SelectItem value={item.id.toString()} key={index}>
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

FilterEntitySelectField.propTypes = {
  control: PropTypes.object.isRequired,
  name: PropTypes.string.isRequired,
  labelKey: PropTypes.string.isRequired,
  id: PropTypes.string.isRequired,
  placeholderKey: PropTypes.string.isRequired,
  dataItems: PropTypes.array.isRequired,
};

/** Movement-type select filter. */
function FilterTypeSelectField({ control }) {
  const { t } = useTranslation();
  return (
    <FormField
      control={control}
      name="type"
      render={({ field }) => (
        <FormItem className="flex flex-col flex-auto">
          <FormLabel htmlFor="type">{t('type')}</FormLabel>
          <Select
            onValueChange={field.onChange}
            value={field.value?.toString()} // Asegura que el valor sea string
          >
            <FormControl id="warehouseId">
              <SelectTrigger>
                <SelectValue placeholder={t('select_type')} />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {movementTypes.map((item, index) => (
                <SelectItem value={item.value} key={index}>
                  {item.label}
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

export const InventoryMovementFiltersForm = ({
  onSubmit,
  onAddDialog,
  products,
  warehouses,
}) => {
  const { t } = useTranslation();
  const form = useForm({
    defaultValues: {
      productId: '',
      warehouseId: '',
      type: '',
      startDate: '',
      endDate: '',
    },
  });

  const handleSubmit = (data) => {
    onSubmit(data);
  };

  const handleAdd = () => {
    onAddDialog();
  };

  const handleResetFilter = () => {
    form.reset();
    onSubmit({});
  };

  return (
    <Form {...form}>
      <form
        method="post"
        action=""
        id="inventory-movement-form"
        noValidate
        onSubmit={form.handleSubmit(handleSubmit)}
        className="flex flex-col flex-wrap gap-5"
      >
        {/* inputs */}
        <div className="flex flex-wrap flex-1 gap-3">
          <FilterEntitySelectField
            control={form.control}
            name="productId"
            labelKey="product"
            id="productId"
            placeholderKey="select_product"
            dataItems={products}
          />

          <FilterEntitySelectField
            control={form.control}
            name="warehouseId"
            labelKey="warehouse"
            id="warehouseId"
            placeholderKey="select_warehouse"
            dataItems={warehouses}
          />

          <FilterTypeSelectField control={form.control} />

          <FilterDateField
            control={form.control}
            name="fdate"
            labelKey="from_date"
          />

          <FilterDateField
            control={form.control}
            name="tdate"
            labelKey="to_date"
          />
        </div>
        {/* buttons */}
        {buildFilterButtons({ t, handleAdd, handleResetFilter })}
      </form>
    </Form>
  );
};

InventoryMovementFiltersForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  onAddDialog: PropTypes.func.isRequired,
  products: PropTypes.array.isRequired,
  warehouses: PropTypes.array.isRequired,
};

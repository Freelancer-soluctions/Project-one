import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { LuPlus, LuSearch, LuEraser } from 'react-icons/lu';
import PropTypes from 'prop-types';
import { FIELD_LIMITS } from '@/config/fieldLimits';

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

/** Lot text filter. */
function FilterLotField({ control }) {
  const { t } = useTranslation();
  return (
    <FormField
      control={control}
      name="lot"
      render={({ field }) => (
        <FormItem className="flex flex-col flex-auto">
          <FormLabel htmlFor="lot">{t('lot')}</FormLabel>
          <FormControl>
            <Input
              id="lot"
              name="lot"
              placeholder={t('search_by_lot')}
              type="text"
              autoComplete="false"
              maxLength={FIELD_LIMITS.stock.lot}
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

FilterLotField.propTypes = {
  control: PropTypes.object.isRequired,
};

/** Unit-measure enum select filter. */
function FilterUnitMeasureField({ control, unitMeasures }) {
  const { t } = useTranslation();
  return (
    <FormField
      control={control}
      name="unitMeasure"
      render={({ field }) => (
        <FormItem className="flex flex-col flex-auto">
          <FormLabel>{t('unit_measure')}</FormLabel>
          <Select onValueChange={field.onChange} value={field.value}>
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder={t('select_unit_measure')} />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {unitMeasures.map((measure, index) => (
                <SelectItem key={index} value={measure.value}>
                  {measure.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormItem>
      )}
    />
  );
}

FilterUnitMeasureField.propTypes = {
  control: PropTypes.object.isRequired,
  unitMeasures: PropTypes.array.isRequired,
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
        onClick={() => handleAdd()}
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

export const StockFiltersForm = ({
  onSubmit,
  onAddDialog,
  unitMeasures,
  products,
  warehouses,
}) => {
  const { t } = useTranslation();

  const form = useForm({
    defaultValues: {
      productId: '',
      warehouseId: '',
      lot: '',
      unitMeasure: '',
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
  };

  return (
    <Form {...form}>
      <form
        method="post"
        action=""
        id="profile-info-form"
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
          <FilterLotField control={form.control} />

          <FilterUnitMeasureField
            control={form.control}
            unitMeasures={unitMeasures}
          />
        </div>
        {/* buttons */}
        {buildFilterButtons({ t, handleAdd, handleResetFilter })}
      </form>
    </Form>
  );
};

StockFiltersForm.propTypes = {
  onSubmit: PropTypes.func,
  onAddDialog: PropTypes.func,
  unitMeasures: PropTypes.array,
  products: PropTypes.array,
  warehouses: PropTypes.array,
};

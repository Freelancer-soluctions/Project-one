import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { FIELD_LIMITS } from '@/config/fieldLimits';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CalendarIcon } from '@radix-ui/react-icons';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import PropTypes from 'prop-types';
import { zodResolver } from '@hookform/resolvers/zod';
import { pickDirty } from '@/utils/pickDirty';
import { StockSchema } from '../utils';
import { useEffect, useMemo } from 'react';
import { LuPackagePlus } from 'react-icons/lu';

/** Normalizes a raw row to form values (ids/numbers as strings). */
const mapRowToFormValues = (row) => ({
  productId: row.productId.toString(),
  warehouseId: row.warehouseId.toString(),
  quantity: row.quantity.toString(),
  minimum: row.minimum.toString(),
  maximum: row.maximum.toString(),
  lot: row.lot || '',
  unitMeasure: row.unitMeasure || 'PIECES',
  price: row.productPrice.toString(),
  cost: row.productCost.toString(),
  totalCost: row.totalCost.toString(),
  expirationDate: row.expirationDate ? new Date(row.expirationDate) : null,
  createdOn: row.createdOn,
  updatedOn: row.updatedOn,
  userStockCreatedName: row.userStockCreatedName || '',
  userStockUpdatedName: row.userStockUpdatedName || '',
});

const EMPTY_FORM_VALUES = {
  quantity: '',
  price: '',
  totalCost: '',
  minimum: '',
  maximum: '',
  lot: '',
  unitMeasure: 'PIECES',
  expirationDate: null,
  productId: '',
  warehouseId: '',
};

/** Entity select field (products/warehouses keyed by id). */
function StockEntitySelectField({
  control,
  name,
  labelKey,
  placeholderKey,
  dataItems,
  required = false,
}) {
  const { t } = useTranslation();
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>
            {t(labelKey)}
            {required ? '*' : ''}
          </FormLabel>
          <Select onValueChange={field.onChange} defaultValue={field.value}>
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder={t(placeholderKey)} />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {dataItems?.map((item) => (
                <SelectItem key={item.id} value={item.id.toString()}>
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

StockEntitySelectField.propTypes = {
  control: PropTypes.object.isRequired,
  name: PropTypes.string.isRequired,
  labelKey: PropTypes.string.isRequired,
  placeholderKey: PropTypes.string.isRequired,
  dataItems: PropTypes.array,
  required: PropTypes.bool,
};

/** Unit-measure enum select field. */
function StockUnitMeasureField({ control, unitMeasures }) {
  const { t } = useTranslation();
  return (
    <FormField
      control={control}
      name="unitMeasure"
      render={({ field }) => (
        <FormItem>
          <FormLabel>{t('unit_measure')}</FormLabel>
          <Select onValueChange={field.onChange} defaultValue={field.value}>
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder={t('select_unit_measure')} />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {unitMeasures.map((measure) => (
                <SelectItem key={measure.value} value={measure.value}>
                  {measure.label}
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

StockUnitMeasureField.propTypes = {
  control: PropTypes.object.isRequired,
  unitMeasures: PropTypes.array.isRequired,
};

/** Expiration date picker (future dates only). */
function StockExpirationDateField({ control }) {
  const { t } = useTranslation();
  return (
    <FormField
      control={control}
      name="expirationDate"
      render={({ field }) => (
        <FormItem className="flex flex-col">
          <FormLabel>{t('expiration_date')}</FormLabel>
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
                  date < new Date() || date < new Date('1900-01-01')
                }
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <FormDescription>{t('expiration_date_description')}</FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

StockExpirationDateField.propTypes = {
  control: PropTypes.object.isRequired,
};

/** Numeric input field. */
function StockNumberField({
  control,
  name,
  labelKey,
  placeholderKey,
  required = false,
}) {
  const { t } = useTranslation();
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel htmlFor={name}>
            {t(labelKey)}
            {required ? '*' : ''}
          </FormLabel>
          <FormControl>
            <Input
              id={name}
              name={name}
              placeholder={t(placeholderKey)}
              type="number"
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

StockNumberField.propTypes = {
  control: PropTypes.object.isRequired,
  name: PropTypes.string.isRequired,
  labelKey: PropTypes.string.isRequired,
  placeholderKey: PropTypes.string.isRequired,
  required: PropTypes.bool,
};

/** Lot text input field. */
function StockLotField({ control }) {
  const { t } = useTranslation();
  return (
    <FormField
      control={control}
      name="lot"
      render={({ field }) => (
        <FormItem>
          <FormLabel htmlFor="lot">{t('lot')}</FormLabel>
          <FormControl>
            <Input
              id="lot"
              name="lot"
              placeholder={t('lot_placeholder')}
              type="text"
              autoComplete="off"
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

StockLotField.propTypes = {
  control: PropTypes.object.isRequired,
};

/** Disabled text field for audit data (created/updated by). */
function StockReadonlyTextField({ control, name, labelKey }) {
  const { t } = useTranslation();
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel htmlFor={name}>{t(labelKey)}</FormLabel>
          <FormControl>
            <Input
              id={name}
              name={name}
              disabled
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

StockReadonlyTextField.propTypes = {
  control: PropTypes.object.isRequired,
  name: PropTypes.string.isRequired,
  labelKey: PropTypes.string.isRequired,
};

/** Disabled date display with calendar popover (created/updated on). */
function StockReadonlyDateField({ control, name, labelKey }) {
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
                  disabled={true}
                  readOnly={true}
                  variant={'outline'}
                  className={cn(
                    'pl-3 text-left font-normal',
                    !field.value && 'text-muted-foreground'
                  )}
                >
                  {field.value && format(field.value, 'PPP')}
                  <CalendarIcon className="w-4 h-4 ml-auto opacity-50" />
                </Button>
              </FormControl>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={field.value}
                onSelect={field.onChange}
                disabled={(date) => date < new Date('1900-01-01')}
              />
            </PopoverContent>
          </Popover>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

StockReadonlyDateField.propTypes = {
  control: PropTypes.object.isRequired,
  name: PropTypes.string.isRequired,
  labelKey: PropTypes.string.isRequired,
};

/** Read-only audit pair: created/updated by + created/updated on. */
function buildAuditPair({ form, nameKey, dateKey, byLabelKey, onLabelKey }) {
  return (
    <>
      <StockReadonlyTextField
        control={form.control}
        name={nameKey}
        labelKey={byLabelKey}
      />
      <StockReadonlyDateField
        control={form.control}
        name={dateKey}
        labelKey={onLabelKey}
      />
    </>
  );
}

/** Product / warehouse select pair. */
function buildEntitySelects({ form, products, warehouses }) {
  return (
    <>
      <StockEntitySelectField
        control={form.control}
        name="productId"
        labelKey="product"
        placeholderKey="select_product"
        dataItems={products}
        required
      />

      <StockEntitySelectField
        control={form.control}
        name="warehouseId"
        labelKey="warehouse"
        placeholderKey="select_warehouse"
        dataItems={warehouses}
        required
      />
    </>
  );
}

/** Quantity + price/total-cost (edit only) + min/max fields. */
function buildQuantityFields({ form, hasProduct }) {
  return (
    <>
      <StockNumberField
        control={form.control}
        name="quantity"
        labelKey="quantity"
        placeholderKey="quantity_placeholder"
        required
      />

      {/* Price/total cost only when a product is selected */}
      {hasProduct && (
        <>
          <StockNumberField
            control={form.control}
            name="price"
            labelKey="price"
            placeholderKey="price_placeholder"
            required
          />
          <StockNumberField
            control={form.control}
            name="totalCost"
            labelKey="total_cost"
            placeholderKey="total_cost_placeholder"
            required
          />
        </>
      )}

      <StockNumberField
        control={form.control}
        name="minimum"
        labelKey="minimum"
        placeholderKey="minimum_placeholder"
        required
      />

      <StockNumberField
        control={form.control}
        name="maximum"
        labelKey="maximum"
        placeholderKey="maximum_placeholder"
        required
      />
    </>
  );
}

/** Grid of dialog form fields in display order. */
function buildStockFields({
  form,
  unitMeasures,
  products,
  warehouses,
  hasProduct,
  hasCreated,
  hasUpdated,
}) {
  return (
    <div className="grid grid-cols-2 gap-6 py-4 auto-rows-auto">
      {buildEntitySelects({ form, products, warehouses })}

      <StockExpirationDateField control={form.control} />

      <StockUnitMeasureField
        control={form.control}
        unitMeasures={unitMeasures}
      />

      {buildQuantityFields({ form, hasProduct })}

      <StockLotField control={form.control} />

      {/* Created By/On Fields */}
      {hasCreated &&
        buildAuditPair({
          form,
          nameKey: 'userStockCreatedName',
          dateKey: 'createdOn',
          byLabelKey: 'created_by',
          onLabelKey: 'created_on',
        })}

      {/* Updated By/On Fields */}
      {hasUpdated &&
        buildAuditPair({
          form,
          nameKey: 'userStockUpdatedName',
          dateKey: 'updatedOn',
          byLabelKey: 'updated_by',
          onLabelKey: 'updated_on',
        })}
    </div>
  );
}

/** Dialog header: package icon, action title and edit/add description. */
function buildDialogHeader({ t, actionDialog, isEdit }) {
  return (
    <DialogHeader>
      <DialogTitle className="flex items-center gap-2">
        <LuPackagePlus className="inline mr-3 w-7 h-7" />
        {actionDialog}
      </DialogTitle>
      <DialogDescription>
        {isEdit ? t('edit_message') : t('add_message')}
      </DialogDescription>
    </DialogHeader>
  );
}

/** Dialog footer: cancel, delete (edit only) and save/update. */
function buildDialogFooter({ t, stockId, handleDeleteById }) {
  return (
    <DialogFooter>
      <DialogClose asChild>
        <Button
          type="button"
          variant="secondary"
          className="flex-1 md:flex-initial md:w-24"
        >
          {t('cancel')}
        </Button>
      </DialogClose>

      {stockId && (
        <Button
          type="button"
          variant="destructive"
          className="flex-1 md:flex-initial md:w-24"
          onClick={handleDeleteById}
        >
          {t('delete')}
        </Button>
      )}
      <Button
        type="submit"
        variant="info"
        className="flex-1 md:flex-initial md:w-24"
      >
        {stockId ? t('update') : t('save')}
      </Button>
    </DialogFooter>
  );
}

/**
 * Dialog form state: reset from the selected row, numeric-string
 * mapping, dirty-field PATCH payloads on edit.
 */
function useStockDialogForm({
  openDialog,
  selectedRow,
  onSubmit,
  onDeleteById,
  onCloseDialog,
}) {
  const form = useForm({
    resolver: zodResolver(StockSchema),
    defaultValues: EMPTY_FORM_VALUES,
  });
  const {
    formState: { dirtyFields },
  } = form;

  const stockId = useMemo(() => selectedRow?.id ?? null, [selectedRow?.id]);

  // Actualiza todos los valores del formulario al cambiar `selectedRow`
  useEffect(() => {
    if (selectedRow?.id) {
      // Filtra y mapea solo los valores necesarios (sin spread para omitir id)
      form.reset(mapRowToFormValues(selectedRow));
    }

    if (!openDialog) {
      form.reset(EMPTY_FORM_VALUES);
    }
  }, [selectedRow, openDialog, form]);

  const handleSubmit = (data) => {
    if (selectedRow?.id) {
      // edit → send only changed fields (PATCH)
      const changes = pickDirty(data, dirtyFields);
      onSubmit({ id: selectedRow.id, body: changes });
    } else {
      // create → send all fields (POST)
      onSubmit(data);
    }
  };

  const handleDeleteById = () => {
    onDeleteById(selectedRow?.id);
  };

  const handleCloseDialog = () => {
    form.reset();
    onCloseDialog();
  };

  return { form, stockId, handleSubmit, handleDeleteById, handleCloseDialog };
}

export const StockDialog = ({
  openDialog,
  onCloseDialog,
  selectedRow,
  unitMeasures,
  products,
  warehouses,
  onSubmit,
  onDeleteById,
  actionDialog,
}) => {
  const { t } = useTranslation();
  const { form, stockId, handleSubmit, handleDeleteById, handleCloseDialog } =
    useStockDialogForm({
      openDialog,
      selectedRow,
      onSubmit,
      onDeleteById,
      onCloseDialog,
    });

  const hasProduct = !!selectedRow?.productId;
  const hasCreated = !!selectedRow?.createdOn;
  const hasUpdated = !!selectedRow?.updatedOn;

  return (
    <Dialog
      open={openDialog}
      onOpenChange={(isOpen) => {
        if (isOpen === true) return;
        handleCloseDialog();
      }}
    >
      <DialogContent className="sm:max-w-[800px]">
        {buildDialogHeader({ t, actionDialog, isEdit: !!selectedRow })}
        <Form {...form}>
          <form
            method="post"
            action=""
            id="warehouse-form"
            onSubmit={form.handleSubmit(handleSubmit)}
            noValidate
            className="flex flex-col flex-wrap gap-5"
          >
            {buildStockFields({
              form,
              unitMeasures,
              products,
              warehouses,
              hasProduct,
              hasCreated,
              hasUpdated,
            })}

            {buildDialogFooter({ t, stockId, handleDeleteById })}
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

StockDialog.propTypes = {
  openDialog: PropTypes.bool,
  onCloseDialog: PropTypes.func,
  selectedRow: PropTypes.object,
  onSubmit: PropTypes.func,
  onDeleteById: PropTypes.func,
  actionDialog: PropTypes.string,
  unitMeasures: PropTypes.array,
  products: PropTypes.array,
  warehouses: PropTypes.array,
};

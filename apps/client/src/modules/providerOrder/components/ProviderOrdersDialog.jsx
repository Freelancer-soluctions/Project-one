import { useEffect } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { LuPackage, LuPlus, LuTrash2 } from 'react-icons/lu';
import PropTypes from 'prop-types';
import { ProviderOrderSchema, ORDER_STATUSES } from '../utils';
import { pickDirty } from '@/utils/pickDirty';
import { FIELD_LIMITS } from '@/config/fieldLimits';

/** Blank detail line for create mode. */
const EMPTY_DETAIL = { productId: '', quantity: 1, estimatedPrice: '' };

/** Fresh form values (a factory so rows never share references). */
const makeEmptyFormValues = () => ({
  supplierId: '',
  status: 'PENDING',
  notes: '',
  expectedDeliveryDate: '',
  details: [{ ...EMPTY_DETAIL }],
  createdOn: '',
  updatedOn: '',
  userProviderOrderCreatedName: '',
  userProviderOrderUpdatedName: '',
});

/** Numeric input field (parametrized). */
function ProviderOrderNumberField({ control, name, labelKey }) {
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
              placeholder={t(labelKey)}
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

ProviderOrderNumberField.propTypes = {
  control: PropTypes.object.isRequired,
  name: PropTypes.string.isRequired,
  labelKey: PropTypes.string.isRequired,
};

/** Status select bound to the order lifecycle enum. */
function ProviderOrderStatusField({ control }) {
  const { t } = useTranslation();
  return (
    <FormField
      control={control}
      name="status"
      render={({ field }) => (
        <FormItem>
          <FormLabel htmlFor="status">{t('status')}</FormLabel>
          <Select value={field.value ?? ''} onValueChange={field.onChange}>
            <FormControl>
              <SelectTrigger id="status">
                <SelectValue placeholder={t('select_status')} />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {ORDER_STATUSES.map((status) => (
                <SelectItem key={status} value={status}>
                  {status}
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

ProviderOrderStatusField.propTypes = {
  control: PropTypes.object.isRequired,
};

/** One editable detail line (product, quantity, estimated price). */
function ProviderOrderDetailRow({ control, index, onRemove }) {
  const { t } = useTranslation();
  return (
    <div className="grid items-end grid-cols-[1fr_6rem_8rem_auto] gap-3">
      <ProviderOrderNumberField
        control={control}
        name={`details.${index}.productId`}
        labelKey="product_id"
      />
      <ProviderOrderNumberField
        control={control}
        name={`details.${index}.quantity`}
        labelKey="quantity"
      />
      <ProviderOrderNumberField
        control={control}
        name={`details.${index}.estimatedPrice`}
        labelKey="estimated_price"
      />
      <Button
        type="button"
        variant="destructive"
        size="icon"
        aria-label={t('remove_detail')}
        onClick={onRemove}
      >
        <LuTrash2 className="w-4 h-4" />
      </Button>
    </div>
  );
}

ProviderOrderDetailRow.propTypes = {
  control: PropTypes.object.isRequired,
  index: PropTypes.number.isRequired,
  onRemove: PropTypes.func.isRequired,
};

/** Detail line editor: rows plus an "add line" action. */
function ProviderOrderDetailsEditor({ control }) {
  const { t } = useTranslation();
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'details',
  });

  return (
    <div className="flex flex-col gap-3">
      <FormLabel>{`${t('details')}*`}</FormLabel>
      {fields.map((field, index) => (
        <ProviderOrderDetailRow
          key={field.id}
          control={control}
          index={index}
          onRemove={() => remove(index)}
        />
      ))}
      <Button
        type="button"
        variant="outline"
        className="self-start"
        onClick={() => append({ ...EMPTY_DETAIL })}
      >
        {t('add_detail')}
        <LuPlus className="w-4 h-4 ml-2" />
      </Button>
    </div>
  );
}

ProviderOrderDetailsEditor.propTypes = {
  control: PropTypes.object.isRequired,
};

/** Notes text input field. */
function ProviderOrderNotesField({ control }) {
  const { t } = useTranslation();
  return (
    <FormField
      control={control}
      name="notes"
      render={({ field }) => (
        <FormItem>
          <FormLabel htmlFor="notes">{t('notes')}</FormLabel>
          <FormControl>
            <Input
              id="notes"
              name="notes"
              placeholder={t('notes_placeholder')}
              type="text"
              autoComplete="off"
              maxLength={FIELD_LIMITS.providerOrder.notes}
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

ProviderOrderNotesField.propTypes = {
  control: PropTypes.object.isRequired,
};

/** Expected delivery date input. */
function ProviderOrderDateField({ control }) {
  const { t } = useTranslation();
  return (
    <FormField
      control={control}
      name="expectedDeliveryDate"
      render={({ field }) => (
        <FormItem>
          <FormLabel htmlFor="expectedDeliveryDate">
            {t('expected_delivery_date')}
          </FormLabel>
          <FormControl>
            <Input
              id="expectedDeliveryDate"
              name="expectedDeliveryDate"
              type="date"
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

ProviderOrderDateField.propTypes = {
  control: PropTypes.object.isRequired,
};

/** Disabled audit text field (created/updated by). */
function ProviderOrderReadonlyTextField({ control, name, labelKey }) {
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

ProviderOrderReadonlyTextField.propTypes = {
  control: PropTypes.object.isRequired,
  name: PropTypes.string.isRequired,
  labelKey: PropTypes.string.isRequired,
};

/** Grid of dialog form fields in display order. */
function buildProviderOrderFields({ form, hasCreated, hasUpdated }) {
  return (
    <div className="flex flex-col gap-6 py-4">
      <div className="grid grid-cols-2 gap-6">
        <ProviderOrderNumberField
          control={form.control}
          name="supplierId"
          labelKey="supplierId"
        />
        <ProviderOrderStatusField control={form.control} />
        <ProviderOrderDateField control={form.control} />
        <ProviderOrderNotesField control={form.control} />
      </div>

      <ProviderOrderDetailsEditor control={form.control} />

      {hasCreated && (
        <ProviderOrderReadonlyTextField
          control={form.control}
          name="userProviderOrderCreatedName"
          labelKey="created_by"
        />
      )}
      {hasUpdated && (
        <ProviderOrderReadonlyTextField
          control={form.control}
          name="userProviderOrderUpdatedName"
          labelKey="updated_by"
        />
      )}
    </div>
  );
}

/** Dialog header: package icon, action title and edit/add description. */
function buildDialogHeader({ t, actionDialog, providerOrderId }) {
  return (
    <DialogHeader>
      <DialogTitle className="flex items-center gap-2">
        <LuPackage className="inline mr-3 w-7 h-7" />
        {actionDialog}
      </DialogTitle>
      <DialogDescription>
        {providerOrderId ? t('edit_message') : t('add_message')}
      </DialogDescription>
    </DialogHeader>
  );
}

/** Dialog footer: cancel, convert, delete (edit only) and save/update. */
function buildDialogFooter({
  t,
  providerOrderId,
  handleDelete,
  canConvert,
  handleConvert,
}) {
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

      {canConvert && (
        <Button
          type="button"
          variant="success"
          className="flex-1 md:flex-initial md:w-auto"
          onClick={handleConvert}
        >
          {t('convert_to_purchase')}
        </Button>
      )}

      {providerOrderId && (
        <Button
          type="button"
          variant="destructive"
          className="flex-1 md:flex-initial md:w-24"
          onClick={handleDelete}
        >
          {t('delete')}
        </Button>
      )}
      <Button
        type="submit"
        variant="info"
        className="flex-1 md:flex-initial md:w-24"
      >
        {providerOrderId ? t('update') : t('save')}
      </Button>
    </DialogFooter>
  );
}

/**
 * Dialog form state: reset from the selected row, dirty-field PATCH
 * payloads on edit. Keeps the original split reset effects.
 */
function useProviderOrderDialogForm({
  openDialog,
  selectedRow,
  onSubmit,
  onDeleteById,
}) {
  const form = useForm({
    resolver: zodResolver(ProviderOrderSchema),
    defaultValues: makeEmptyFormValues(),
  });
  const {
    formState: { dirtyFields },
  } = form;

  const providerOrderId = selectedRow?.id ?? null;

  // Actualiza todos los valores del formulario al cambiar `selectedRow`
  useEffect(() => {
    if (!selectedRow?.id) return;

    form.reset({
      supplierId: selectedRow.supplierId,
      status: selectedRow.status,
      notes: selectedRow.notes ?? '',
      expectedDeliveryDate: selectedRow.expectedDeliveryDate
        ? selectedRow.expectedDeliveryDate.slice(0, 10)
        : '',
      details:
        selectedRow.details?.length > 0
          ? selectedRow.details.map((detail) => ({
              productId: detail.productId,
              quantity: detail.quantity,
              estimatedPrice: detail.estimatedPrice,
            }))
          : [{ ...EMPTY_DETAIL }],
      createdOn: selectedRow.createdOn,
      updatedOn: selectedRow.updatedOn,
      userProviderOrderCreatedName: selectedRow.userProviderOrderCreatedName,
      userProviderOrderUpdatedName: selectedRow.userProviderOrderUpdatedName,
    });
  }, [selectedRow, form]);

  useEffect(() => {
    if (!openDialog) {
      form.reset(makeEmptyFormValues());
    }
  }, [openDialog, form]);

  const handleSubmit = (data) => {
    if (providerOrderId) {
      // edit → send only changed fields (PATCH)
      const changes = pickDirty(data, dirtyFields);
      onSubmit({ id: providerOrderId, body: changes });
    } else {
      // create → send all fields (POST)
      onSubmit(data);
    }
  };

  const handleDelete = () => {
    onDeleteById(providerOrderId);
  };

  return { form, providerOrderId, handleSubmit, handleDelete };
}

export const ProviderOrdersDialog = ({
  openDialog,
  onCloseDialog,
  selectedRow,
  onSubmit,
  onDeleteById,
  onConvertById,
  actionDialog,
}) => {
  const { t } = useTranslation();
  const { form, providerOrderId, handleSubmit, handleDelete } =
    useProviderOrderDialogForm({
      openDialog,
      selectedRow,
      onSubmit,
      onDeleteById,
    });

  const hasCreated = selectedRow?.createdOn && providerOrderId;
  const hasUpdated = selectedRow?.updatedOn && providerOrderId;

  // Conversion is only meaningful for a saved order with no linked purchase.
  const canConvert =
    !!providerOrderId &&
    !selectedRow?.purchaseId &&
    selectedRow?.status !== 'CANCELLED';
  const handleConvert = () => onConvertById(providerOrderId);

  return (
    <Dialog open={openDialog} onOpenChange={onCloseDialog}>
      <DialogContent className="sm:max-w-[760px]">
        {buildDialogHeader({ t, actionDialog, providerOrderId })}
        <Form {...form}>
          <form
            method="post"
            action=""
            id="provider-order-form"
            noValidate
            onSubmit={form.handleSubmit(handleSubmit)}
            className="flex flex-col flex-wrap gap-5"
          >
            {buildProviderOrderFields({ form, hasCreated, hasUpdated })}

            {buildDialogFooter({
              t,
              providerOrderId,
              handleDelete,
              canConvert,
              handleConvert,
            })}
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

ProviderOrdersDialog.propTypes = {
  openDialog: PropTypes.bool.isRequired,
  onCloseDialog: PropTypes.func.isRequired,
  selectedRow: PropTypes.object,
  onSubmit: PropTypes.func.isRequired,
  onDeleteById: PropTypes.func.isRequired,
  onConvertById: PropTypes.func.isRequired,
  actionDialog: PropTypes.string.isRequired,
};

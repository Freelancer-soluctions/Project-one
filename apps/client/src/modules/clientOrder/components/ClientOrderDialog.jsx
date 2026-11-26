import { useEffect, useMemo } from 'react';
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
import { LuUsersRound, LuPlus, LuTrash2 } from 'react-icons/lu';
import PropTypes from 'prop-types';
import { pickDirty } from '@/utils/pickDirty';
import { ClientOrderSchema, ORDER_STATUSES } from '../utils';

/** Blank detail line for create mode. */
const EMPTY_DETAIL = { productId: '', quantity: 1, unitPrice: '' };

/** Fresh form values (a factory so rows never share references). */
const makeEmptyFormValues = () => ({
  clientId: '',
  status: 'PENDING',
  notes: '',
  expectedDeliveryDate: '',
  details: [{ ...EMPTY_DETAIL }],
});

/** Maps a selected row (API shape) to the form values shape. */
const mapRowToFormValues = (selectedRow) => ({
  clientId: selectedRow.clientId,
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
          unitPrice: detail.unitPrice,
        }))
      : [{ ...EMPTY_DETAIL }],
});

/** Generic parametrized input field for the client order form. */
const ClientOrderInputField = ({ control, name, label, placeholder, type }) => (
  <FormField
    control={control}
    name={name}
    render={({ field }) => (
      <FormItem>
        <FormLabel htmlFor={name}>{label}</FormLabel>
        <FormControl>
          <Input
            id={name}
            name={name}
            placeholder={placeholder}
            type={type}
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

ClientOrderInputField.propTypes = {
  control: PropTypes.object.isRequired,
  name: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  placeholder: PropTypes.string.isRequired,
  type: PropTypes.string.isRequired,
};

/** Status select bound to the order lifecycle enum. */
const ClientOrderStatusField = ({ control }) => {
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
};

ClientOrderStatusField.propTypes = {
  control: PropTypes.object.isRequired,
};

/** One editable detail line (product, quantity, unit price). */
const ClientOrderDetailRow = ({ control, index, onRemove }) => {
  const { t } = useTranslation();
  return (
    <div className="grid items-end grid-cols-[1fr_6rem_8rem_auto] gap-3">
      <ClientOrderInputField
        control={control}
        name={`details.${index}.productId`}
        label={`${t('product_id')}*`}
        placeholder={t('product_id')}
        type="number"
      />
      <ClientOrderInputField
        control={control}
        name={`details.${index}.quantity`}
        label={`${t('quantity')}*`}
        placeholder="1"
        type="number"
      />
      <ClientOrderInputField
        control={control}
        name={`details.${index}.unitPrice`}
        label={`${t('unit_price')}*`}
        placeholder="0.00"
        type="number"
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
};

ClientOrderDetailRow.propTypes = {
  control: PropTypes.object.isRequired,
  index: PropTypes.number.isRequired,
  onRemove: PropTypes.func.isRequired,
};

/** Detail line editor: rows plus an "add line" action. */
const ClientOrderDetailsEditor = ({ control }) => {
  const { t } = useTranslation();
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'details',
  });

  return (
    <div className="flex flex-col gap-3">
      <FormLabel>{`${t('details')}*`}</FormLabel>
      {fields.map((field, index) => (
        <ClientOrderDetailRow
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
};

ClientOrderDetailsEditor.propTypes = {
  control: PropTypes.object.isRequired,
};

/** Form grid with the client order fields. */
const buildClientOrderFields = ({ control, t }) => (
  <div className="flex flex-col gap-6 py-4">
    <div className="grid grid-cols-2 gap-6">
      <ClientOrderInputField
        control={control}
        name="clientId"
        label={`${t('clientId')}*`}
        placeholder={t('clientOrder_clientId_placeholder')}
        type="number"
      />
      <ClientOrderStatusField control={control} />
      <ClientOrderInputField
        control={control}
        name="expectedDeliveryDate"
        label={t('expected_delivery_date')}
        placeholder={t('expected_delivery_date')}
        type="date"
      />
      <ClientOrderInputField
        control={control}
        name="notes"
        label={t('notes')}
        placeholder={t('notes_placeholder')}
        type="text"
      />
    </div>
    <ClientOrderDetailsEditor control={control} />
  </div>
);

/** Dialog header with the module icon and add/edit description. */
const buildDialogHeader = ({ t, actionDialog, isEdit }) => (
  <DialogHeader>
    <DialogTitle className="flex items-center gap-2">
      <LuUsersRound className="inline mr-3 w-7 h-7" />
      {actionDialog}
    </DialogTitle>
    <DialogDescription>
      {isEdit ? t('edit_message') : t('add_message')}
    </DialogDescription>
  </DialogHeader>
);

/** Dialog footer with cancel, convert, conditional delete and submit buttons. */
const buildDialogFooter = ({ t, isEdit, onDelete, canConvert, onConvert }) => (
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
        onClick={onConvert}
      >
        {t('convert_to_sale')}
      </Button>
    )}

    {isEdit && (
      <Button
        type="button"
        variant="destructive"
        className="flex-1 md:flex-initial md:w-24"
        onClick={onDelete}
      >
        {t('delete')}
      </Button>
    )}
    <Button
      type="submit"
      variant="info"
      className="flex-1 md:flex-initial md:w-24"
    >
      {isEdit ? t('update') : t('save')}
    </Button>
  </DialogFooter>
);

/**
 * Form state for the client order dialog: reset on row change and on
 * close, plus the memoized editing id.
 */
function useClientOrderDialogForm({ selectedRow, openDialog }) {
  const form = useForm({
    resolver: zodResolver(ClientOrderSchema),
    defaultValues: makeEmptyFormValues(),
  });
  const {
    formState: { dirtyFields },
  } = form;

  const clientOrderId = useMemo(
    () => selectedRow?.id ?? null,
    [selectedRow?.id]
  );

  // Actualiza todos los valores del formulario al cambiar `selectedRow`
  useEffect(() => {
    if (selectedRow?.id) {
      // Filtra y mapea solo los valores necesarios
      form.reset(mapRowToFormValues(selectedRow));
    }

    if (!openDialog) {
      form.reset(makeEmptyFormValues());
    }
  }, [selectedRow, openDialog, form]);

  return { form, dirtyFields, clientOrderId };
}

/** Submit handler: PATCH with only dirty fields on edit, POST otherwise. */
const makeSubmitHandler =
  ({ clientOrderId, dirtyFields, onSubmit }) =>
  (data) => {
    if (clientOrderId) {
      const changes = pickDirty(data, dirtyFields);
      onSubmit({ id: clientOrderId, body: changes });
    } else {
      onSubmit(data);
    }
  };

export const ClientOrderDialog = ({
  openDialog,
  onCloseDialog,
  selectedRow,
  onSubmit,
  onDeleteById,
  onConvertById,
  actionDialog,
}) => {
  const { t } = useTranslation();
  const { form, dirtyFields, clientOrderId } = useClientOrderDialogForm({
    selectedRow,
    openDialog,
  });

  // Conversion is only meaningful for a saved order with no linked sale.
  const canConvert =
    !!clientOrderId &&
    !selectedRow?.saleId &&
    selectedRow?.status !== 'CANCELLED';

  const handleSubmit = makeSubmitHandler({
    clientOrderId,
    dirtyFields,
    onSubmit,
  });
  const handleDelete = () => {
    onDeleteById(selectedRow.id);
  };
  const handleConvert = () => {
    onConvertById(selectedRow.id);
  };

  return (
    <Dialog open={openDialog} onOpenChange={onCloseDialog}>
      <DialogContent className="sm:max-w-[760px]">
        {buildDialogHeader({ t, actionDialog, isEdit: !!clientOrderId })}
        <Form {...form}>
          <form
            method="post"
            action=""
            id="clientOrder-form"
            noValidate
            onSubmit={form.handleSubmit(handleSubmit)}
            className="flex flex-col flex-wrap gap-5"
          >
            {buildClientOrderFields({ control: form.control, t })}
            {buildDialogFooter({
              t,
              isEdit: !!clientOrderId,
              onDelete: handleDelete,
              canConvert,
              onConvert: handleConvert,
            })}
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

ClientOrderDialog.propTypes = {
  openDialog: PropTypes.bool.isRequired,
  onCloseDialog: PropTypes.func.isRequired,
  selectedRow: PropTypes.object,
  onSubmit: PropTypes.func.isRequired,
  onDeleteById: PropTypes.func.isRequired,
  onConvertById: PropTypes.func.isRequired,
  actionDialog: PropTypes.string.isRequired,
};

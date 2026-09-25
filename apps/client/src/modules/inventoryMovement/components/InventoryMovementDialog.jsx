import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { FIELD_LIMITS } from '@/config/fieldLimits';
import PropTypes from 'prop-types';
import { useEffect } from 'react';
import { InventoryMovementSchema, MOVEMENT_TYPES } from '../utils';
import { pickDirty } from '@/utils/pickDirty';

const EMPTY_FORM_VALUES = {
  productId: '',
  warehouseId: '',
  quantity: '',
  type: '',
  reason: '',
};

/** Entity select with native options (products/warehouses keyed by id). */
function MovementEntitySelectField({
  control,
  name,
  labelKey,
  placeholderKey,
  dataItems,
}) {
  const { t } = useTranslation();
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{t(labelKey)}</FormLabel>
          <Select onValueChange={field.onChange} value={field.value}>
            <option value="">{t(placeholderKey)}</option>
            {dataItems.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

MovementEntitySelectField.propTypes = {
  control: PropTypes.object.isRequired,
  name: PropTypes.string.isRequired,
  labelKey: PropTypes.string.isRequired,
  placeholderKey: PropTypes.string.isRequired,
  dataItems: PropTypes.array.isRequired,
};

/** Movement-type select with native options. */
function MovementTypeSelectField({ control }) {
  const { t } = useTranslation();
  return (
    <FormField
      control={control}
      name="type"
      render={({ field }) => (
        <FormItem>
          <FormLabel>{t('type')}</FormLabel>
          <Select onValueChange={field.onChange} value={field.value}>
            <option value="">{t('select_type')}</option>
            {Object.values(MOVEMENT_TYPES).map((type) => (
              <option key={type} value={type}>
                {t(type.toLowerCase())}
              </option>
            ))}
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

MovementTypeSelectField.propTypes = {
  control: PropTypes.object.isRequired,
};

/** Quantity numeric input field. */
function MovementQuantityField({ control }) {
  const { t } = useTranslation();
  return (
    <FormField
      control={control}
      name="quantity"
      render={({ field }) => (
        <FormItem>
          <FormLabel>{t('quantity')}</FormLabel>
          <FormControl>
            <Input type="number" {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

MovementQuantityField.propTypes = {
  control: PropTypes.object.isRequired,
};

/** Reason textarea field. */
function MovementReasonField({ control }) {
  const { t } = useTranslation();
  return (
    <FormField
      control={control}
      name="reason"
      render={({ field }) => (
        <FormItem>
          <FormLabel>{t('reason')}</FormLabel>
          <FormControl>
            <Textarea
              {...field}
              maxLength={FIELD_LIMITS.inventoryMovement.reason}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

MovementReasonField.propTypes = {
  control: PropTypes.object.isRequired,
};

/** Dialog action buttons: submit, delete (edit only), cancel. */
function buildDialogButtons({ t, isEdit, handleDelete, handleCloseDialog }) {
  return (
    <div className="flex justify-end gap-4 mt-6">
      <Button type="submit" variant="default">
        {isEdit ? t('update') : t('add')}
      </Button>
      {isEdit && (
        <Button type="button" variant="destructive" onClick={handleDelete}>
          {t('delete')}
        </Button>
      )}
      <Button type="button" variant="outline" onClick={handleCloseDialog}>
        {t('cancel')}
      </Button>
    </div>
  );
}

/**
 * Dialog form state: reset from the selected row, numeric-string
 * mapping, close-after-submit flow.
 */
function useMovementDialogForm({
  selectedRow,
  onSubmit,
  onDeleteById,
  onCloseDialog,
}) {
  const form = useForm({
    resolver: zodResolver(InventoryMovementSchema),
    defaultValues: EMPTY_FORM_VALUES,
  });
  const {
    formState: { dirtyFields },
  } = form;

  useEffect(() => {
    if (selectedRow?.id) {
      form.reset({
        productId: selectedRow.productId?.toString() ?? '',
        warehouseId: selectedRow.warehouseId?.toString() ?? '',
        quantity: selectedRow.quantity?.toString() ?? '',
        type: selectedRow.type ?? '',
        reason: selectedRow.reason ?? '',
      });
    }
  }, [selectedRow, form]);

  const handleCloseDialog = () => {
    form.reset();
    onCloseDialog();
  };

  const handleSubmit = async (data) => {
    if (selectedRow?.id) {
      // edit → send only changed fields (PATCH)
      const changes = pickDirty(data, dirtyFields);
      await onSubmit({ id: selectedRow?.id, body: changes });
      handleCloseDialog();
    } else {
      // create → send all fields (POST)
      await onSubmit(data);
      handleCloseDialog();
    }
  };

  const handleDelete = async () => {
    await onDeleteById(selectedRow.id);
    handleCloseDialog();
  };

  return { form, handleSubmit, handleDelete, handleCloseDialog };
}

export const InventoryMovementDialog = ({
  openDialog,
  onCloseDialog,
  selectedRow,
  onSubmit,
  onDeleteById,
  actionDialog,
  products,
  warehouses,
}) => {
  const { t } = useTranslation();
  const { form, handleSubmit, handleDelete, handleCloseDialog } =
    useMovementDialogForm({
      selectedRow,
      onSubmit,
      onDeleteById,
      onCloseDialog,
    });

  const isEdit = !!selectedRow?.id;

  return (
    <Dialog open={openDialog} onOpenChange={handleCloseDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{actionDialog}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <MovementEntitySelectField
              control={form.control}
              name="productId"
              labelKey="product"
              placeholderKey="select_product"
              dataItems={products}
            />

            <MovementEntitySelectField
              control={form.control}
              name="warehouseId"
              labelKey="warehouse"
              placeholderKey="select_warehouse"
              dataItems={warehouses}
            />

            <MovementQuantityField control={form.control} />

            <MovementTypeSelectField control={form.control} />

            <MovementReasonField control={form.control} />

            {buildDialogButtons({
              t,
              isEdit,
              handleDelete,
              handleCloseDialog,
            })}
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

InventoryMovementDialog.propTypes = {
  openDialog: PropTypes.bool.isRequired,
  onCloseDialog: PropTypes.func.isRequired,
  selectedRow: PropTypes.object,
  onSubmit: PropTypes.func.isRequired,
  onDeleteById: PropTypes.func.isRequired,
  actionDialog: PropTypes.string.isRequired,
  products: PropTypes.array.isRequired,
  warehouses: PropTypes.array.isRequired,
};

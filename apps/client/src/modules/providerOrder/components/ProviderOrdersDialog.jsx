import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
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
import { LuPackage } from 'react-icons/lu';
import PropTypes from 'prop-types';
import { ProviderOrderSchema } from '../utils';
import { pickDirty } from '@/utils/pickDirty';
import { FIELD_LIMITS } from '@/config/fieldLimits';

const EMPTY_FORM_VALUES = {
  supplierId: '',
  notes: '',
  createdOn: '',
  updatedOn: '',
  userProviderOrderCreatedName: '',
  userProviderOrderUpdatedName: '',
};

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
    <div className="grid grid-cols-1 gap-6 py-4 auto-rows-auto">
      <ProviderOrderNumberField
        control={form.control}
        name="supplierId"
        labelKey="supplierId"
      />

      <ProviderOrderNotesField control={form.control} />

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

/** Dialog footer: cancel, delete (edit only) and save/update. */
function buildDialogFooter({ t, providerOrderId, handleDelete }) {
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
    defaultValues: EMPTY_FORM_VALUES,
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
      notes: selectedRow.notes,
      createdOn: selectedRow.createdOn,
      updatedOn: selectedRow.updatedOn,
      userProviderOrderCreatedName: selectedRow.userProviderOrderCreatedName,
      userProviderOrderUpdatedName: selectedRow.userProviderOrderUpdatedName,
    });
  }, [selectedRow, form]);

  useEffect(() => {
    if (!openDialog) {
      form.reset(EMPTY_FORM_VALUES);
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

  return (
    <Dialog open={openDialog} onOpenChange={onCloseDialog}>
      <DialogContent className="sm:max-w-[600px]">
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

            {buildDialogFooter({ t, providerOrderId, handleDelete })}
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
  actionDialog: PropTypes.string.isRequired,
};

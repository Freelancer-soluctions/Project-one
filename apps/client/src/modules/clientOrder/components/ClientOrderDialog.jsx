import { useEffect, useMemo } from 'react';
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
import { LuUsersRound } from 'react-icons/lu';
import PropTypes from 'prop-types';
import { pickDirty } from '@/utils/pickDirty';

const EMPTY_FORM_VALUES = {
  clientId: '',
  status: '',
  notes: '',
  saleId: '',
};

/** Maps a selected row to the form values shape. */
const mapRowToFormValues = (selectedRow) => ({
  clientId: selectedRow.clientId,
  status: selectedRow.status,
  notes: selectedRow.notes,
  saleId: selectedRow.saleId,
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

/** Form grid with the client order input fields. */
const buildClientOrderFields = ({ control, t }) => (
  <div className="grid grid-cols-2 gap-6 py-4 auto-rows-auto">
    <ClientOrderInputField
      control={control}
      name="clientId"
      label={`${t('clientId')}*`}
      placeholder={t('clientOrder_clientId_placeholder')}
      type="number"
    />
    <ClientOrderInputField
      control={control}
      name="notes"
      label={t('notes')}
      placeholder={t('clientOrder_notes_placeholder')}
      type="text"
    />
    <ClientOrderInputField
      control={control}
      name="saleId"
      label={t('saleId')}
      placeholder={t('clientOrder_saleId_placeholder')}
      type="number"
    />
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

/** Dialog footer with cancel, conditional delete and submit buttons. */
const buildDialogFooter = ({ t, isEdit, onDelete }) => (
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
    resolver: zodResolver(),
    defaultValues: EMPTY_FORM_VALUES,
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
      form.reset(EMPTY_FORM_VALUES);
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
  actionDialog,
}) => {
  const { t } = useTranslation();
  const { form, dirtyFields, clientOrderId } = useClientOrderDialogForm({
    selectedRow,
    openDialog,
  });

  const handleSubmit = makeSubmitHandler({
    clientOrderId,
    dirtyFields,
    onSubmit,
  });
  const handleDelete = () => {
    onDeleteById(selectedRow.id);
  };

  return (
    <Dialog open={openDialog} onOpenChange={onCloseDialog}>
      <DialogContent className="sm:max-w-[600px]">
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
  actionDialog: PropTypes.string.isRequired,
};

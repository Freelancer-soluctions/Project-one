import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { pickDirty } from '@/utils/pickDirty';
import { useTranslation } from 'react-i18next';
import { zodResolver } from '@hookform/resolvers/zod';
import { FIELD_LIMITS } from '@/config/fieldLimits';
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon } from '@radix-ui/react-icons';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { LuUsersRound } from 'react-icons/lu';
import PropTypes from 'prop-types';
import { ClientSchema } from '../utils';

/** Normalizes a raw row to form values (audit fields included). */
const mapRowToFormValues = (row) => ({
  name: row.name,
  email: row.email,
  phone: row.phone,
  address: row.address,
  createdOn: row.createdOn,
  updatedOn: row.updatedOn,
  userClientCreatedName: row.userClientCreatedName,
  userClientUpdatedName: row.userClientUpdatedName,
});

const EMPTY_FORM_VALUES = {
  name: '',
  email: '',
  phone: '',
  address: '',
  createdOn: '',
  updatedOn: '',
  userClientCreatedName: '',
  userClientUpdatedName: '',
};

/** Text input field (parametrized name/label/placeholder/type). */
function ClientTextField({
  control,
  name,
  labelKey,
  placeholderKey,
  type = 'text',
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
              type={type}
              autoComplete="off"
              maxLength={FIELD_LIMITS.clients[name]}
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

ClientTextField.propTypes = {
  control: PropTypes.object.isRequired,
  name: PropTypes.string.isRequired,
  labelKey: PropTypes.string.isRequired,
  placeholderKey: PropTypes.string.isRequired,
  type: PropTypes.string,
  required: PropTypes.bool,
};

/** Disabled text field for audit data (created/updated by). */
function ClientReadonlyTextField({ control, name, labelKey }) {
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

ClientReadonlyTextField.propTypes = {
  control: PropTypes.object.isRequired,
  name: PropTypes.string.isRequired,
  labelKey: PropTypes.string.isRequired,
};

/** Disabled date display with calendar popover (created/updated on). */
function ClientReadonlyDateField({ control, name, labelKey }) {
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

ClientReadonlyDateField.propTypes = {
  control: PropTypes.object.isRequired,
  name: PropTypes.string.isRequired,
  labelKey: PropTypes.string.isRequired,
};

/** Read-only audit pair: created/updated by + created/updated on. */
function buildAuditPair({ form, nameKey, dateKey, byLabelKey, onLabelKey }) {
  return (
    <>
      <ClientReadonlyTextField
        control={form.control}
        name={nameKey}
        labelKey={byLabelKey}
      />
      <ClientReadonlyDateField
        control={form.control}
        name={dateKey}
        labelKey={onLabelKey}
      />
    </>
  );
}

/** Text fields rendered in the dialog grid, in order. */
const CLIENT_TEXT_FIELDS = [
  {
    name: 'name',
    labelKey: 'name',
    placeholderKey: 'client_name_placeholder',
    required: true,
  },
  {
    name: 'email',
    labelKey: 'email',
    placeholderKey: 'client_email_placeholder',
    type: 'email',
    required: true,
  },
  {
    name: 'phone',
    labelKey: 'phone',
    placeholderKey: 'client_phone_placeholder',
    type: 'tel',
    required: true,
  },
  {
    name: 'address',
    labelKey: 'address',
    placeholderKey: 'client_address_placeholder',
    required: true,
  },
];

/** Renders a list of text-field definitions in order. */
const renderTextFields = (form, defs) =>
  defs.map((def) => (
    <ClientTextField key={def.name} control={form.control} {...def} />
  ));

/** Grid of dialog form fields in display order. */
function buildClientFields({ form, hasCreated, hasUpdated }) {
  return (
    <div className="grid grid-cols-2 gap-6 py-4 auto-rows-auto">
      {renderTextFields(form, CLIENT_TEXT_FIELDS)}

      {/* Created By/On Fields */}
      {hasCreated &&
        buildAuditPair({
          form,
          nameKey: 'userClientCreatedName',
          dateKey: 'createdOn',
          byLabelKey: 'created_by',
          onLabelKey: 'created_on',
        })}

      {/* Updated By/On Fields */}
      {hasUpdated &&
        buildAuditPair({
          form,
          nameKey: 'userClientUpdatedName',
          dateKey: 'updatedOn',
          byLabelKey: 'updated_by',
          onLabelKey: 'updated_on',
        })}
    </div>
  );
}

/** Dialog header: users icon, action title and edit/add description. */
function buildDialogHeader({ t, actionDialog, clientId }) {
  return (
    <DialogHeader>
      <DialogTitle className="flex items-center gap-2">
        <LuUsersRound className="inline mr-3 w-7 h-7" />
        {actionDialog}
      </DialogTitle>
      <DialogDescription>
        {clientId ? t('edit_message') : t('add_message')}
      </DialogDescription>
    </DialogHeader>
  );
}

/** Dialog footer: cancel, delete (edit only) and save/update. */
function buildDialogFooter({ t, clientId, handleDelete }) {
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

      {clientId && (
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
        {clientId ? t('update') : t('save')}
      </Button>
    </DialogFooter>
  );
}

/**
 * Dialog form state: reset from the selected row, dirty-field PATCH
 * payloads on edit.
 */
function useClientDialogForm({
  openDialog,
  selectedRow,
  onSubmit,
  onDeleteById,
}) {
  const clientId = useMemo(() => selectedRow?.id ?? null, [selectedRow?.id]);

  const form = useForm({
    resolver: zodResolver(ClientSchema),
    defaultValues: EMPTY_FORM_VALUES,
  });

  const {
    formState: { dirtyFields },
  } = form;

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

  const handleSubmit = (data) => {
    if (clientId) {
      // edit → send only changed fields (PATCH)
      const changes = pickDirty(data, dirtyFields);
      onSubmit({ id: clientId, body: changes });
    } else {
      // create → send all fields (POST)
      onSubmit(data);
    }
  };

  const handleDelete = () => {
    onDeleteById(selectedRow.id);
  };

  return { form, clientId, handleSubmit, handleDelete };
}

export const ClientsDialog = ({
  openDialog,
  onCloseDialog,
  selectedRow,
  onSubmit,
  onDeleteById,
  actionDialog,
}) => {
  const { t } = useTranslation();
  const { form, clientId, handleSubmit, handleDelete } = useClientDialogForm({
    openDialog,
    selectedRow,
    onSubmit,
    onDeleteById,
  });

  const hasCreated = selectedRow?.createdOn && clientId;
  const hasUpdated = selectedRow?.updatedOn && clientId;

  return (
    <Dialog open={openDialog} onOpenChange={onCloseDialog}>
      <DialogContent className="sm:max-w-[600px]">
        {buildDialogHeader({ t, actionDialog, clientId })}
        <Form {...form}>
          <form
            method="post"
            action=""
            id="client-form"
            noValidate
            onSubmit={form.handleSubmit(handleSubmit)}
            className="flex flex-col flex-wrap gap-5"
          >
            {buildClientFields({ form, hasCreated, hasUpdated })}

            {buildDialogFooter({ t, clientId, handleDelete })}
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

ClientsDialog.propTypes = {
  openDialog: PropTypes.bool.isRequired,
  onCloseDialog: PropTypes.func.isRequired,
  selectedRow: PropTypes.object,
  onSubmit: PropTypes.func.isRequired,
  onDeleteById: PropTypes.func.isRequired,
  actionDialog: PropTypes.string.isRequired,
};

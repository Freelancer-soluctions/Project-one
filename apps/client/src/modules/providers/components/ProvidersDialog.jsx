import { useEffect } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon } from '@radix-ui/react-icons';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { LuBuilding2 } from 'react-icons/lu';
import PropTypes from 'prop-types';
import { ProvidersDialogSchema } from '../utils';

const EMPTY_FORM_VALUES = {
  name: '',
  status: undefined,
  contactName: '',
  contactEmail: '',
  contactPhone: '',
  address: '',
  createdOn: '',
  updatedOn: '',
  userProvidersCreatedName: '',
  userProvidersUpdatedName: '',
};

/** Normalizes a raw row to form values (audit fields included). */
const mapRowToFormValues = (row) => ({
  name: row.name || '',
  status: row.status || '',
  code: row.code || '',
  contactName: row.contactName || '',
  contactEmail: row.contactEmail || '',
  contactPhone: row.contactPhone || '',
  address: row.address || '',
  createdOn: row.createdOn || '',
  updatedOn: row.updatedOn || '',
  userProvidersCreatedName: row.userProvidersCreatedName || '',
  userProvidersUpdatedName: row.userProvidersUpdatedName || '',
});

/** Text input field (parametrized name/label/placeholder/type). */
function ProviderTextField({
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
        <FormItem className="flex flex-col flex-auto">
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
              maxLength={FIELD_LIMITS.productProviders[name]}
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

ProviderTextField.propTypes = {
  control: PropTypes.object.isRequired,
  name: PropTypes.string.isRequired,
  labelKey: PropTypes.string.isRequired,
  placeholderKey: PropTypes.string.isRequired,
  type: PropTypes.string,
  required: PropTypes.bool,
};

/** Boolean status select ('true'/'false' strings ↔ boolean). */
function ProviderStatusSelectField({ control, dataStatus }) {
  const { t } = useTranslation();
  return (
    <FormField
      control={control}
      name="status"
      render={({ field }) => (
        <FormItem>
          <FormLabel htmlFor="status">{t('status')}*</FormLabel>
          <Select
            onValueChange={(value) => field.onChange(value === 'true')}
            value={field.value?.toString()}
          >
            <FormControl>
              <SelectTrigger
                className={cn(
                  'w-full',
                  !field.value && 'text-muted-foreground'
                )}
              >
                <SelectValue
                  placeholder={t('select_status')}
                  className="w-full"
                />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {dataStatus.map((item, index) => (
                <SelectItem key={index} value={item.value.toString()}>
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

ProviderStatusSelectField.propTypes = {
  control: PropTypes.object.isRequired,
  dataStatus: PropTypes.array.isRequired,
};

/** Disabled text field for audit data (created/updated by). */
function ProviderReadonlyTextField({ control, name, labelKey }) {
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

ProviderReadonlyTextField.propTypes = {
  control: PropTypes.object.isRequired,
  name: PropTypes.string.isRequired,
  labelKey: PropTypes.string.isRequired,
};

/** Disabled date display with calendar popover (created/updated on). */
function ProviderReadonlyDateField({ control, name, labelKey }) {
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

ProviderReadonlyDateField.propTypes = {
  control: PropTypes.object.isRequired,
  name: PropTypes.string.isRequired,
  labelKey: PropTypes.string.isRequired,
};

/** Read-only audit pair: created/updated by + created/updated on. */
function buildAuditPair({ control, nameKey, dateKey, byLabelKey, onLabelKey }) {
  return (
    <>
      <ProviderReadonlyTextField
        control={control}
        name={nameKey}
        labelKey={byLabelKey}
      />
      <ProviderReadonlyDateField
        control={control}
        name={dateKey}
        labelKey={onLabelKey}
      />
    </>
  );
}

/** Grid of dialog form fields in display order. */
function buildProviderFields({ form, dataStatus, hasCreated, hasUpdated }) {
  const { control } = form;
  return (
    <div className="grid grid-cols-2 gap-6 py-4 auto-rows-auto">
      <ProviderTextField
        control={control}
        name="name"
        labelKey="name"
        placeholderKey="provider_name_placeholder"
        required
      />
      <ProviderStatusSelectField control={control} dataStatus={dataStatus} />
      <ProviderTextField
        control={control}
        name="contactName"
        labelKey="contact_name"
        placeholderKey="contact_name_placeholder"
      />
      <ProviderTextField
        control={control}
        name="contactEmail"
        labelKey="contact_email"
        placeholderKey="contact_email_placeholder"
        type="email"
      />
      <ProviderTextField
        control={control}
        name="contactPhone"
        labelKey="contact_phone"
        placeholderKey="contact_phone_placeholder"
      />
      <ProviderTextField
        control={control}
        name="address"
        labelKey="address"
        placeholderKey="address_placeholder"
      />

      {hasCreated &&
        buildAuditPair({
          control,
          nameKey: 'userProvidersCreatedName',
          dateKey: 'createdOn',
          byLabelKey: 'created_by',
          onLabelKey: 'created_on',
        })}

      {hasUpdated &&
        buildAuditPair({
          control,
          nameKey: 'userProvidersUpdatedName',
          dateKey: 'updatedOn',
          byLabelKey: 'updated_by',
          onLabelKey: 'updated_on',
        })}
    </div>
  );
}

/** Dialog header with the module icon and add/edit description. */
const buildDialogHeader = ({ t, actionDialog, isEdit }) => (
  <DialogHeader>
    <DialogTitle className="flex items-center gap-2">
      <LuBuilding2 className="inline mr-3 w-7 h-7" />
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
 * Form state for the providers dialog: reset on row change and on
 * close.
 */
function useProviderDialogForm({ selectedRow, openDialog }) {
  const form = useForm({
    resolver: zodResolver(ProvidersDialogSchema),
    defaultValues: EMPTY_FORM_VALUES,
  });
  const {
    formState: { dirtyFields },
  } = form;

  // Actualiza todos los valores del formulario al cambiar `selectedRow`
  useEffect(() => {
    if (!selectedRow?.id) return;

    form.reset(mapRowToFormValues(selectedRow));
  }, [selectedRow, form]);

  useEffect(() => {
    if (!openDialog) {
      form.reset();
    }
  }, [openDialog, form]);

  return { form, dirtyFields, providerId: selectedRow?.id ?? null };
}

/** Submit handler: PATCH with only dirty fields on edit, POST otherwise. */
const makeSubmitHandler =
  ({ providerId, dirtyFields, onSubmit }) =>
  (data) => {
    if (providerId) {
      const changes = pickDirty(data, dirtyFields);
      onSubmit({ id: providerId, body: changes });
    } else {
      onSubmit(data);
    }
  };

export const ProvidersDialog = ({
  openDialog,
  onCloseDialog,
  selectedRow,
  dataStatus,
  onSubmit,
  onDeleteById,
  actionDialog,
}) => {
  const { t } = useTranslation();
  const { form, dirtyFields, providerId } = useProviderDialogForm({
    selectedRow,
    openDialog,
  });

  const handleSubmit = makeSubmitHandler({
    providerId,
    dirtyFields,
    onSubmit,
  });
  const handleDeleteById = () => {
    onDeleteById(providerId);
  };

  return (
    <Dialog
      open={openDialog}
      onOpenChange={(isOpen) => {
        if (isOpen === true) return;
        onCloseDialog();
      }}
    >
      <DialogContent className="sm:max-w-[600px]">
        {buildDialogHeader({ t, actionDialog, isEdit: !!providerId })}
        <Form {...form}>
          <form
            method="post"
            action=""
            id="providers-form"
            onSubmit={form.handleSubmit(handleSubmit)}
            noValidate
            className="flex flex-col flex-wrap gap-5"
          >
            {buildProviderFields({
              form,
              dataStatus,
              hasCreated: !!selectedRow?.createdOn,
              hasUpdated: !!selectedRow?.updatedOn,
            })}
            {buildDialogFooter({
              t,
              isEdit: !!providerId,
              onDelete: handleDeleteById,
            })}
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

ProvidersDialog.propTypes = {
  openDialog: PropTypes.bool,
  onCloseDialog: PropTypes.func,
  selectedRow: PropTypes.object,
  dataStatus: PropTypes.array,
  onSubmit: PropTypes.func,
  onDeleteById: PropTypes.func,
  actionDialog: PropTypes.string,
};

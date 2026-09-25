import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { pickDirty } from '@/utils/pickDirty';
import { zodResolver } from '@hookform/resolvers/zod';
import { WarehouseSchema } from '../utils/index';
import { FIELD_LIMITS } from '@/config/fieldLimits';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { LuBuilding2 } from 'react-icons/lu';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import PropTypes from 'prop-types';
import { CalendarIcon } from '@radix-ui/react-icons';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';

/** Text input field (parametrized name/label/placeholder). */
function WarehouseTextField({
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
              type="text"
              autoComplete="off"
              maxLength={FIELD_LIMITS.warehouse[name]}
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

WarehouseTextField.propTypes = {
  control: PropTypes.object.isRequired,
  name: PropTypes.string.isRequired,
  labelKey: PropTypes.string.isRequired,
  placeholderKey: PropTypes.string.isRequired,
  required: PropTypes.bool,
};

/** Status select field fed from the warehouse status enum. */
function WarehouseStatusSelectField({ control, dataStatus }) {
  const { t } = useTranslation();
  return (
    <FormField
      control={control}
      name="status"
      render={({ field }) => (
        <FormItem>
          <FormLabel htmlFor="status">{t('status')}*</FormLabel>
          <Select
            onValueChange={field.onChange}
            value={field.value?.toString()} // Asegura que el valor sea string
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

WarehouseStatusSelectField.propTypes = {
  control: PropTypes.object.isRequired,
  dataStatus: PropTypes.array.isRequired,
};

/** Disabled date display with calendar popover (created/updated on). */
function WarehouseReadonlyDateField({ control, name, labelKey }) {
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

WarehouseReadonlyDateField.propTypes = {
  control: PropTypes.object.isRequired,
  name: PropTypes.string.isRequired,
  labelKey: PropTypes.string.isRequired,
};

/** Grid of dialog form fields in display order. */
function buildWarehouseFields({ form, dataStatus, warehouseId, selectedRow }) {
  return (
    <div className="grid grid-cols-2 gap-6 py-4 auto-rows-auto">
      <WarehouseTextField
        control={form.control}
        name="name"
        labelKey="name"
        placeholderKey="warehouse_name_placeholder"
        required
      />

      <WarehouseStatusSelectField
        control={form.control}
        dataStatus={dataStatus}
      />

      <WarehouseTextField
        control={form.control}
        name="description"
        labelKey="description"
        placeholderKey="description_placeholder"
      />

      <WarehouseTextField
        control={form.control}
        name="address"
        labelKey="address"
        placeholderKey="address_placeholder"
      />

      {warehouseId && (
        <WarehouseReadonlyDateField
          control={form.control}
          name="createdOn"
          labelKey="created_on"
        />
      )}
      {warehouseId && selectedRow?.updatedOn && (
        <WarehouseReadonlyDateField
          control={form.control}
          name="updatedOn"
          labelKey="updated_on"
        />
      )}
    </div>
  );
}

/** Dialog header: building icon, action title and edit/add description. */
function buildDialogHeader({ t, actionDialog, warehouseId }) {
  return (
    <DialogHeader>
      <DialogTitle className="flex items-center gap-2">
        <LuBuilding2 className="inline mr-3 w-7 h-7" />
        {actionDialog}
      </DialogTitle>
      <DialogDescription>
        {warehouseId ? t('edit_message') : t('add_message')}
      </DialogDescription>
    </DialogHeader>
  );
}

/** Dialog footer: cancel, delete (edit only) and save/update. */
function buildDialogFooter({ t, warehouseId, handleDeleteById }) {
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

      {warehouseId && (
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
        {warehouseId ? t('update') : t('save')}
      </Button>
    </DialogFooter>
  );
}

/**
 * Dialog form state: reset from the selected row, dirty-field PATCH
 * payloads on edit.
 */
function useWarehouseDialogForm({
  openDialog,
  selectedRow,
  onSubmit,
  onDeleteById,
}) {
  // Configura el formulario
  const form = useForm({
    resolver: zodResolver(WarehouseSchema),
    defaultValues: {
      name: '',
      status: '',
      description: '',
      address: '',
    },
  });

  const {
    formState: { dirtyFields },
  } = form;
  const warehouseId = useMemo(() => selectedRow?.id ?? null, [selectedRow?.id]);

  // Actualiza todos los valores del formulario al cambiar `selectedRow`
  useEffect(() => {
    if (selectedRow?.id) {
      // Filtra y mapea solo los valores necesarios
      form.reset({
        name: selectedRow.name || '',
        status: selectedRow.status || '',
        description: selectedRow.description || '',
        address: selectedRow.address || '',
        createdOn: selectedRow.createdOn || '',
        updatedOn: selectedRow.updatedOn || '',
      });
    }

    if (!openDialog) {
      form.reset();
    }
  }, [selectedRow, openDialog, form]);

  const handleSubmit = (data) => {
    if (warehouseId) {
      // edit → send only changed fields (PATCH)
      const changes = pickDirty(data, dirtyFields);
      onSubmit({ id: warehouseId, body: changes });
    } else {
      // create → send all fields (POST)
      onSubmit(data);
    }
  };

  const handleDeleteById = () => {
    onDeleteById(warehouseId);
  };

  return { form, warehouseId, handleSubmit, handleDeleteById };
}

export const WarehouseDialog = ({
  openDialog,
  onCloseDialog,
  selectedRow,
  dataStatus,
  onSubmit,
  onDeleteById,
  actionDialog,
}) => {
  const { t } = useTranslation();
  const { form, warehouseId, handleSubmit, handleDeleteById } =
    useWarehouseDialogForm({ openDialog, selectedRow, onSubmit, onDeleteById });

  return (
    <Dialog
      open={openDialog}
      onOpenChange={(isOpen) => {
        if (isOpen === true) return;
        onCloseDialog();
      }}
    >
      <DialogContent className="sm:max-w-[600px]">
        {buildDialogHeader({ t, actionDialog, warehouseId })}
        <Form {...form}>
          <form
            method="post"
            action=""
            id="warehouse-form"
            onSubmit={form.handleSubmit(handleSubmit)}
            noValidate
            className="flex flex-col flex-wrap gap-5"
          >
            {buildWarehouseFields({
              form,
              dataStatus,
              warehouseId,
              selectedRow,
            })}

            {buildDialogFooter({ t, warehouseId, handleDeleteById })}
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

WarehouseDialog.propTypes = {
  openDialog: PropTypes.bool,
  onCloseDialog: PropTypes.func,
  selectedRow: PropTypes.object,
  dataStatus: PropTypes.array,
  onSubmit: PropTypes.func,
  onDeleteById: PropTypes.func,
  actionDialog: PropTypes.string,
};

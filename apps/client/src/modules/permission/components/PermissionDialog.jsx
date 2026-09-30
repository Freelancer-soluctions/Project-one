import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { zodResolver } from '@hookform/resolvers/zod';
import { pickDirty } from '@/utils/pickDirty';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import PropTypes from 'prop-types';
import { FIELD_LIMITS } from '@/config/fieldLimits';

import {
  PermissionSchema,
  PERMISSION_TYPES,
  PERMISSION_STATUS,
} from '../utils'; // Import schema

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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea'; // Import Textarea
import { Button } from '@/components/ui/button';
import { CalendarIcon } from '@radix-ui/react-icons'; // Using ClipboardIcon
import { LuClipboard } from 'react-icons/lu';

/** Normalizes a raw row to form values (dates as Date for the Calendar). */
const mapRowToFormValues = (row) => ({
  employeeId: row.employeeId,
  type: row.type,
  startDate: row.startDate ? new Date(row.startDate) : null,
  endDate: row.endDate ? new Date(row.endDate) : null,
  reason: row.reason ?? '',
  status: row.status ?? 'PENDING',
  comments: row.comments ?? '',
  createdOn: row.createdOn,
  updatedOn: row.updatedOn,
  userPermissionCreatedName: row.userPermissionCreatedName,
  userPermissionUpdatedName: row.userPermissionUpdatedName,
  // approvedBy and approvedAt are likely handled by the backend
});

const EMPTY_FORM_VALUES = {
  employeeId: '',
  type: undefined, // Use undefined for initial Select state
  startDate: null,
  endDate: null,
  reason: '',
  status: 'PENDING',
  comments: '',
};

/** Converts form dates to ISO strings for submission. */
const toSubmissionValues = (data) => ({
  ...data,
  startDate: data.startDate ? format(data.startDate, 'yyyy-MM-dd') : null,
  endDate: data.endDate ? format(data.endDate, 'yyyy-MM-dd') : null,
});

/** Employee select field. */
function PermissionEmployeeField({ control, dataEmployees }) {
  const { t } = useTranslation();
  return (
    <FormField
      control={control}
      name="employeeId"
      render={({ field }) => (
        <FormItem>
          <FormLabel>{t('employee')}*</FormLabel>
          <Select
            onValueChange={field.onChange}
            value={field.value?.toString() ?? ''}
          >
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder={t('select_employee_placeholder')} />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {dataEmployees.map((employee) => (
                <SelectItem key={employee.id} value={employee.id.toString()}>
                  {`${employee.name} ${employee.lastName}`}
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

PermissionEmployeeField.propTypes = {
  control: PropTypes.object.isRequired,
  dataEmployees: PropTypes.array.isRequired,
};

/** Type select field. */
function PermissionTypeField({ control }) {
  const { t } = useTranslation();
  return (
    <FormField
      control={control}
      name="type"
      render={({ field }) => (
        <FormItem>
          <FormLabel>{t('type')}*</FormLabel>
          <Select onValueChange={field.onChange} value={field.value ?? ''}>
            <FormControl>
              <SelectTrigger>
                <SelectValue
                  placeholder={t('select_permission_type_placeholder')}
                />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {PERMISSION_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {t(`permission_type.${type}`)}{' '}
                  {/* Assumes translations like permission_type.SICK */}
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

PermissionTypeField.propTypes = {
  control: PropTypes.object.isRequired,
};

/** Status select field. */
function PermissionStatusField({ control }) {
  const { t } = useTranslation();
  return (
    <FormField
      control={control}
      name="status"
      render={({ field }) => (
        <FormItem>
          <FormLabel>{t('status')}*</FormLabel>
          <Select
            onValueChange={field.onChange}
            value={field.value ?? 'PENDING'}
            // Consider disabling based on user role
          >
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder={t('select_status_placeholder')} />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {PERMISSION_STATUS.map((status) => (
                <SelectItem key={status} value={status}>
                  {t(`status.${status}`)}
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

PermissionStatusField.propTypes = {
  control: PropTypes.object.isRequired,
};

/** Date picker field (endDate disables dates before startDate). */
function PermissionDateField({ control, form, name, labelKey }) {
  const { t } = useTranslation();
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className="flex flex-col">
          <FormLabel>{t(labelKey)}*</FormLabel>
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
                disabled={
                  name === 'endDate'
                    ? (date) =>
                        form.getValues('startDate') &&
                        date < form.getValues('startDate')
                    : undefined
                }
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

PermissionDateField.propTypes = {
  control: PropTypes.object.isRequired,
  form: PropTypes.object.isRequired,
  name: PropTypes.string.isRequired,
  labelKey: PropTypes.string.isRequired,
};

/** Textarea field spanning the full grid width. */
function PermissionTextareaField({
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
        <FormItem className="md:col-span-3">
          {' '}
          {/* Span across grid */}
          <FormLabel htmlFor={name}>
            {t(labelKey)}
            {required ? '*' : ''}
          </FormLabel>
          <FormControl>
            <Textarea
              id={name}
              name={name}
              placeholder={t(placeholderKey)}
              maxLength={FIELD_LIMITS.permission[name]}
              rows={3}
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

PermissionTextareaField.propTypes = {
  control: PropTypes.object.isRequired,
  name: PropTypes.string.isRequired,
  labelKey: PropTypes.string.isRequired,
  placeholderKey: PropTypes.string.isRequired,
  required: PropTypes.bool,
};

/** Disabled text field for audit data (created/updated by). */
function PermissionReadonlyTextField({ control, name, labelKey }) {
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

PermissionReadonlyTextField.propTypes = {
  control: PropTypes.object.isRequired,
  name: PropTypes.string.isRequired,
  labelKey: PropTypes.string.isRequired,
};

/** Disabled date display with calendar popover (created/updated on). */
function PermissionReadonlyDateField({ control, name, labelKey }) {
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
                  {field.value && format(new Date(field.value), 'PPP')}
                  <CalendarIcon className="w-4 h-4 ml-auto opacity-50" />
                </Button>
              </FormControl>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={field.value ? new Date(field.value) : null}
                disabled={true}
              />
            </PopoverContent>
          </Popover>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

PermissionReadonlyDateField.propTypes = {
  control: PropTypes.object.isRequired,
  name: PropTypes.string.isRequired,
  labelKey: PropTypes.string.isRequired,
};

/** Read-only audit pair with the grid spacer after it. */
function buildAuditPair({ form, nameKey, dateKey, byLabelKey, onLabelKey }) {
  return (
    <>
      <PermissionReadonlyTextField
        control={form.control}
        name={nameKey}
        labelKey={byLabelKey}
      />
      <PermissionReadonlyDateField
        control={form.control}
        name={dateKey}
        labelKey={onLabelKey}
      />
      {/* Spacer */}
      <div className="md:col-span-1"></div>
    </>
  );
}

/** Grid of dialog form fields in display order. */
function buildPermissionFields({
  form,
  dataEmployees,
  hasCreated,
  hasUpdated,
}) {
  return (
    <div className="grid grid-cols-1 gap-6 py-4 md:grid-cols-3 auto-rows-auto">
      {/* Employee Select */}
      <PermissionEmployeeField
        control={form.control}
        dataEmployees={dataEmployees}
      />

      {/* Type Select */}
      <PermissionTypeField control={form.control} />

      {/* Status Select */}
      <PermissionStatusField control={form.control} />

      {/* Start Date Picker */}
      <PermissionDateField
        control={form.control}
        form={form}
        name="startDate"
        labelKey="start_date"
      />

      {/* End Date Picker */}
      <PermissionDateField
        control={form.control}
        form={form}
        name="endDate"
        labelKey="end_date"
      />

      {/* Spacer - Can add another field like approvedBy if needed and handled by FE */}
      <div className="md:col-span-1"></div>

      {/* Reason Textarea */}
      <PermissionTextareaField
        control={form.control}
        name="reason"
        labelKey="reason"
        placeholderKey="permission_reason_placeholder"
        required
      />

      {/* Comments Textarea */}
      <PermissionTextareaField
        control={form.control}
        name="comments"
        labelKey="comments"
        placeholderKey="permission_comments_placeholder"
      />

      {/* Created By/On Fields */}
      {hasCreated &&
        buildAuditPair({
          form,
          nameKey: 'userPermissionCreatedName',
          dateKey: 'createdOn',
          byLabelKey: 'created_by',
          onLabelKey: 'created_on',
        })}

      {/* Updated By/On Fields */}
      {hasUpdated &&
        buildAuditPair({
          form,
          nameKey: 'userPermissionUpdatedName',
          dateKey: 'updatedOn',
          byLabelKey: 'updated_by',
          onLabelKey: 'updated_on',
        })}
    </div>
  );
}

/** Dialog header: clipboard icon, action title and edit/add description. */
function buildDialogHeader({ t, actionDialog, permissionId }) {
  return (
    <DialogHeader>
      <DialogTitle className="flex items-center gap-2">
        <LuClipboard className="inline mr-3 w-7 h-7" /> {/* Changed Icon */}
        {actionDialog}
      </DialogTitle>
      <DialogDescription>
        {permissionId
          ? t('edit_permission_message')
          : t('add_permission_message')}
      </DialogDescription>
    </DialogHeader>
  );
}

/** Dialog footer: cancel, delete (edit only) and save/update. */
function buildDialogFooter({ t, permissionId, handleDelete }) {
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

      {permissionId && (
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
        {permissionId ? t('update') : t('save')}
      </Button>
    </DialogFooter>
  );
}

/**
 * Dialog form state: reset from the selected row, date formatting +
 * dirty-field PATCH payloads on edit.
 */
function usePermissionDialogForm({
  openDialog,
  selectedRow,
  onSubmit,
  onDeleteById,
}) {
  const form = useForm({
    resolver: zodResolver(PermissionSchema),
    defaultValues: EMPTY_FORM_VALUES,
  });
  const {
    formState: { dirtyFields },
  } = form;
  const permissionId = useMemo(
    () => selectedRow?.id ?? null,
    [selectedRow?.id]
  );

  useEffect(() => {
    if (selectedRow?.id) {
      form.reset(mapRowToFormValues(selectedRow));
    } else {
      form.reset(EMPTY_FORM_VALUES);
    }
  }, [selectedRow, openDialog, form]);

  const handleSubmit = (data) => {
    const submissionData = toSubmissionValues(data);
    if (permissionId) {
      // edit → send only changed fields (PATCH)
      const changes = pickDirty(submissionData, dirtyFields);
      onSubmit({ id: permissionId, body: changes });
    } else {
      // create → send all fields (POST)
      onSubmit(submissionData);
    }
  };

  const handleDelete = () => {
    if (selectedRow?.id) {
      onDeleteById(selectedRow.id);
    }
  };

  return { form, permissionId, handleSubmit, handleDelete };
}

export const PermissionDialog = ({
  openDialog,
  onCloseDialog,
  selectedRow,
  onSubmit,
  onDeleteById,
  actionDialog,
  dataEmployees,
}) => {
  const { t } = useTranslation();
  const { form, permissionId, handleSubmit, handleDelete } =
    usePermissionDialogForm({
      openDialog,
      selectedRow,
      onSubmit,
      onDeleteById,
    });

  const hasCreated = selectedRow?.createdOn && permissionId;
  const hasUpdated = selectedRow?.updatedOn && permissionId;

  return (
    <Dialog open={openDialog} onOpenChange={onCloseDialog}>
      {/* Increased max width for more fields */}
      <DialogContent className="sm:max-w-[750px]">
        {buildDialogHeader({ t, actionDialog, permissionId })}
        <Form {...form}>
          <form
            method="post"
            action=""
            id="permission-form"
            noValidate
            onSubmit={form.handleSubmit(handleSubmit)}
            className="flex flex-col flex-wrap gap-5"
          >
            {/* Use grid-cols-3 for potentially more fields per row */}
            {buildPermissionFields({
              form,
              dataEmployees,
              hasCreated,
              hasUpdated,
            })}

            {buildDialogFooter({ t, permissionId, handleDelete })}
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

PermissionDialog.propTypes = {
  openDialog: PropTypes.bool.isRequired,
  onCloseDialog: PropTypes.func.isRequired,
  selectedRow: PropTypes.object,
  onSubmit: PropTypes.func.isRequired,
  onDeleteById: PropTypes.func.isRequired,
  actionDialog: PropTypes.string.isRequired,
  dataEmployees: PropTypes.array.isRequired,
};

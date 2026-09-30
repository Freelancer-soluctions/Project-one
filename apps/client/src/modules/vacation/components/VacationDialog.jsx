import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { pickDirty } from '@/utils/pickDirty';
import { useTranslation } from 'react-i18next';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import PropTypes from 'prop-types';

import { VacationSchema, VACATION_STATUS } from '../utils'; // Import schema

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
import { Input } from '@/components/ui/input'; // Keep Input for CreatedBy/UpdatedBy
import { Button } from '@/components/ui/button';
import { CalendarIcon } from '@radix-ui/react-icons'; // Using BackpackIcon
import { LuBackpack } from 'react-icons/lu';

/** Normalizes a raw row to form values (dates as Date for the Calendar). */
const mapRowToFormValues = (row) => ({
  employeeId: row.employeeId,
  startDate: row.startDate ? new Date(row.startDate) : null,
  endDate: row.endDate ? new Date(row.endDate) : null,
  status: row.status ?? 'PENDING',
  createdOn: row.createdOn,
  updatedOn: row.updatedOn,
  userVacationCreatedName: row.userVacationCreatedName,
  userVacationUpdatedName: row.userVacationUpdatedName,
});

const EMPTY_FORM_VALUES = {
  employeeId: '',
  startDate: null,
  endDate: null,
  status: 'PENDING',
};

/** Converts form dates to ISO strings for submission. */
const toSubmissionValues = (data) => ({
  ...data,
  startDate: data.startDate ? format(data.startDate, 'yyyy-MM-dd') : null,
  endDate: data.endDate ? format(data.endDate, 'yyyy-MM-dd') : null,
});

/** Employee select field. */
function VacationEmployeeField({ control, dataEmployees }) {
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

VacationEmployeeField.propTypes = {
  control: PropTypes.object.isRequired,
  dataEmployees: PropTypes.array.isRequired,
};

/** Status select field. */
function VacationStatusField({ control }) {
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
            // Consider disabling if not admin/manager
          >
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder={t('select_status_placeholder')} />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {VACATION_STATUS.map((status) => (
                <SelectItem key={status} value={status}>
                  {t(`status.${status}`)}{' '}
                  {/* Assumes translations like status.PENDING */}
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

VacationStatusField.propTypes = {
  control: PropTypes.object.isRequired,
};

/** Date picker field (endDate disables dates before startDate). */
function VacationDateField({ control, form, name, labelKey }) {
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
                    ? // Disable dates before the selected start date
                      (date) =>
                        form.getValues('startDate') &&
                        date < form.getValues('startDate')
                    : // Optionally disable past dates
                      // disabled={(date) => date < new Date() }
                      undefined
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

VacationDateField.propTypes = {
  control: PropTypes.object.isRequired,
  form: PropTypes.object.isRequired,
  name: PropTypes.string.isRequired,
  labelKey: PropTypes.string.isRequired,
};

/** Disabled text field for audit data (created/updated by). */
function VacationReadonlyTextField({ control, name, labelKey }) {
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

VacationReadonlyTextField.propTypes = {
  control: PropTypes.object.isRequired,
  name: PropTypes.string.isRequired,
  labelKey: PropTypes.string.isRequired,
};

/** Disabled date display with calendar popover (created/updated on). */
function VacationReadonlyDateField({ control, name, labelKey }) {
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

VacationReadonlyDateField.propTypes = {
  control: PropTypes.object.isRequired,
  name: PropTypes.string.isRequired,
  labelKey: PropTypes.string.isRequired,
};

/** Read-only audit pair: created/updated by + created/updated on. */
function buildAuditPair({ form, nameKey, dateKey, byLabelKey, onLabelKey }) {
  return (
    <>
      <VacationReadonlyTextField
        control={form.control}
        name={nameKey}
        labelKey={byLabelKey}
      />
      <VacationReadonlyDateField
        control={form.control}
        name={dateKey}
        labelKey={onLabelKey}
      />
    </>
  );
}

/** Grid of dialog form fields in display order. */
function buildVacationFields({ form, dataEmployees, hasCreated, hasUpdated }) {
  return (
    <div className="grid grid-cols-2 gap-6 py-4 auto-rows-auto">
      {/* Employee Select */}
      <VacationEmployeeField
        control={form.control}
        dataEmployees={dataEmployees}
      />

      {/* Status Select */}
      <VacationStatusField control={form.control} />

      {/* Start Date Picker */}
      <VacationDateField
        control={form.control}
        form={form}
        name="startDate"
        labelKey="start_date"
      />

      {/* End Date Picker */}
      <VacationDateField
        control={form.control}
        form={form}
        name="endDate"
        labelKey="end_date"
      />

      {/* Created By/On Fields */}
      {hasCreated &&
        buildAuditPair({
          form,
          nameKey: 'userVacationCreatedName',
          dateKey: 'createdOn',
          byLabelKey: 'created_by',
          onLabelKey: 'created_on',
        })}

      {/* Updated By/On Fields */}
      {hasUpdated &&
        buildAuditPair({
          form,
          nameKey: 'userVacationUpdatedName',
          dateKey: 'updatedOn',
          byLabelKey: 'updated_by',
          onLabelKey: 'updated_on',
        })}
    </div>
  );
}

/** Dialog header: backpack icon, action title and edit/add description. */
function buildDialogHeader({ t, actionDialog, vacationId }) {
  return (
    <DialogHeader>
      <DialogTitle className="flex items-center gap-2">
        <LuBackpack className="inline mr-3 w-7 h-7" /> {/* Changed Icon */}
        {actionDialog}
      </DialogTitle>
      <DialogDescription>
        {vacationId ? t('edit_vacation_message') : t('add_vacation_message')}
      </DialogDescription>
    </DialogHeader>
  );
}

/** Dialog footer: cancel, delete (edit only) and save/update. */
function buildDialogFooter({ t, vacationId, handleDelete }) {
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

      {vacationId && (
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
        {vacationId ? t('update') : t('save')}
      </Button>
    </DialogFooter>
  );
}

/**
 * Dialog form state: reset from the selected row, date formatting +
 * dirty-field PATCH payloads on edit.
 */
function useVacationDialogForm({
  openDialog,
  selectedRow,
  onSubmit,
  onDeleteById,
}) {
  const form = useForm({
    resolver: zodResolver(VacationSchema),
    defaultValues: EMPTY_FORM_VALUES,
  });
  const {
    formState: { dirtyFields },
  } = form;
  const vacationId = useMemo(() => selectedRow?.id ?? null, [selectedRow?.id]);

  useEffect(() => {
    if (selectedRow?.id) {
      form.reset(mapRowToFormValues(selectedRow));
    } else {
      form.reset(EMPTY_FORM_VALUES);
    }
  }, [selectedRow, openDialog, form]);

  const handleSubmit = (data) => {
    const submissionData = toSubmissionValues(data);

    if (vacationId) {
      // edit → send only changed fields (PATCH)
      const changes = pickDirty(submissionData, dirtyFields);
      onSubmit({ id: vacationId, body: changes });
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

  return { form, vacationId, handleSubmit, handleDelete };
}

export const VacationDialog = ({
  openDialog,
  onCloseDialog,
  selectedRow,
  onSubmit,
  onDeleteById,
  actionDialog,
  dataEmployees,
}) => {
  const { t } = useTranslation();
  const { form, vacationId, handleSubmit, handleDelete } =
    useVacationDialogForm({ openDialog, selectedRow, onSubmit, onDeleteById });

  const hasCreated = selectedRow?.createdOn && vacationId;
  const hasUpdated = selectedRow?.updatedOn && vacationId;

  return (
    <Dialog open={openDialog} onOpenChange={onCloseDialog}>
      <DialogContent className="sm:max-w-[600px]">
        {buildDialogHeader({ t, actionDialog, vacationId })}
        <Form {...form}>
          <form
            method="post"
            action=""
            id="vacation-form"
            noValidate
            onSubmit={form.handleSubmit(handleSubmit)}
            className="flex flex-col flex-wrap gap-5"
          >
            {buildVacationFields({
              form,
              dataEmployees,
              hasCreated,
              hasUpdated,
            })}

            {buildDialogFooter({ t, vacationId, handleDelete })}
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

VacationDialog.propTypes = {
  openDialog: PropTypes.bool.isRequired,
  onCloseDialog: PropTypes.func.isRequired,
  selectedRow: PropTypes.object,
  onSubmit: PropTypes.func.isRequired,
  onDeleteById: PropTypes.func.isRequired,
  actionDialog: PropTypes.string.isRequired,
  dataEmployees: PropTypes.array.isRequired,
};

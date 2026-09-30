import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { pickDirty } from '@/utils/pickDirty';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import PropTypes from 'prop-types';

import { AttendanceSchema } from '../utils'; // Import attendance schema

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
import { Button } from '@/components/ui/button';
import { CalendarIcon, ClockIcon } from '@radix-ui/react-icons'; // Using ClockIcon for time fields

/** Normalizes a raw row to form values (date as Date for the Calendar). */
const mapRowToFormValues = (row) => ({
  employeeId: row.employeeId,
  // Ensure date is a Date object for the Calendar component
  date: row.date ? new Date(row.date) : null,
  entryTime: row.entryTime,
  exitTime: row.exitTime,
  workedHours: row.workedHours,
  createdOn: row.createdOn,
  updatedOn: row.updatedOn,
  userAttendanceCreatedName: row.userAttendanceCreatedName,
  userAttendanceUpdatedName: row.userAttendanceUpdatedName,
});

const EMPTY_FORM_VALUES = {
  employeeId: '',
  date: undefined,
  entryTime: '',
  exitTime: '',
  workedHours: '',
};

/** Employee select field. */
function AttendanceEmployeeField({ control, dataEmployees }) {
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

AttendanceEmployeeField.propTypes = {
  control: PropTypes.object.isRequired,
  dataEmployees: PropTypes.array.isRequired,
};

/** Date picker field (past dates only). */
function AttendanceDateField({ control }) {
  const { t } = useTranslation();
  return (
    <FormField
      control={control}
      name="date"
      render={({ field }) => (
        <FormItem>
          <FormLabel>{t('date')}*</FormLabel>
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
                disabled={(date) =>
                  date > new Date() || date < new Date('1900-01-01')
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

AttendanceDateField.propTypes = {
  control: PropTypes.object.isRequired,
};

/** Time input field (HH:mm). */
function AttendanceTimeField({ control, name, labelKey }) {
  const { t } = useTranslation();
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel htmlFor={name}>{t(labelKey)}*</FormLabel>
          <FormControl>
            <Input
              id={name}
              name={name}
              placeholder="HH:mm"
              type="time"
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

AttendanceTimeField.propTypes = {
  control: PropTypes.object.isRequired,
  name: PropTypes.string.isRequired,
  labelKey: PropTypes.string.isRequired,
};

/** Worked hours numeric input (decimals allowed). */
function AttendanceWorkedHoursField({ control }) {
  const { t } = useTranslation();
  return (
    <FormField
      control={control}
      name="workedHours"
      render={({ field }) => (
        <FormItem>
          <FormLabel htmlFor="workedHours">{t('worked_hours')}*</FormLabel>
          <FormControl>
            <Input
              id="workedHours"
              name="workedHours"
              placeholder={t('worked_hours_placeholder')}
              type="number"
              step="0.01" // Allow decimals
              min="0"
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

AttendanceWorkedHoursField.propTypes = {
  control: PropTypes.object.isRequired,
};

/** Disabled text field for audit data (created/updated by). */
function AttendanceReadonlyTextField({ control, name, labelKey }) {
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

AttendanceReadonlyTextField.propTypes = {
  control: PropTypes.object.isRequired,
  name: PropTypes.string.isRequired,
  labelKey: PropTypes.string.isRequired,
};

/** Disabled date display with calendar popover (created/updated on). */
function AttendanceReadonlyDateField({ control, name, labelKey }) {
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

AttendanceReadonlyDateField.propTypes = {
  control: PropTypes.object.isRequired,
  name: PropTypes.string.isRequired,
  labelKey: PropTypes.string.isRequired,
};

/** Grid of dialog form fields. */
function buildAttendanceFields({
  form,
  dataEmployees,
  hasCreated,
  hasUpdated,
}) {
  return (
    <div className="grid grid-cols-2 gap-6 py-4 auto-rows-auto">
      <AttendanceEmployeeField
        control={form.control}
        dataEmployees={dataEmployees}
      />
      <AttendanceDateField control={form.control} />
      <AttendanceTimeField
        control={form.control}
        name="entryTime"
        labelKey="entry_time"
      />
      <AttendanceTimeField
        control={form.control}
        name="exitTime"
        labelKey="exit_time"
      />
      <AttendanceWorkedHoursField control={form.control} />

      {/* Created By/On Fields */}
      {hasCreated && (
        <>
          <AttendanceReadonlyTextField
            control={form.control}
            name="userAttendanceCreatedName"
            labelKey="created_by"
          />
          <AttendanceReadonlyDateField
            control={form.control}
            name="createdOn"
            labelKey="created_on"
          />
        </>
      )}

      {/* Updated By/On Fields */}
      {hasUpdated && (
        <>
          <AttendanceReadonlyTextField
            control={form.control}
            name="userAttendanceUpdatedName"
            labelKey="updated_by"
          />
          <AttendanceReadonlyDateField
            control={form.control}
            name="updatedOn"
            labelKey="updated_on"
          />
        </>
      )}
    </div>
  );
}

/** Dialog header: clock icon, action title and edit/add description. */
function buildDialogHeader({ t, actionDialog, attendanceId }) {
  return (
    <DialogHeader>
      <DialogTitle className="flex items-center gap-2">
        <ClockIcon className="inline mr-3 w-7 h-7" />
        {actionDialog}
      </DialogTitle>
      <DialogDescription>
        {attendanceId ? t('edit_message') : t('add_message')}
      </DialogDescription>
    </DialogHeader>
  );
}

/** Dialog footer: cancel, delete (edit only) and save/update. */
function buildDialogFooter({ t, attendanceId, handleDelete }) {
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

      {attendanceId && (
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
        {attendanceId ? t('update') : t('save')}
      </Button>
    </DialogFooter>
  );
}

/**
 * Dialog form state: reset from the selected row, dirty-field PATCH payloads.
 */
function useAttendanceDialogForm({
  openDialog,
  selectedRow,
  onSubmit,
  onDeleteById,
}) {
  const form = useForm({
    resolver: zodResolver(AttendanceSchema),
    defaultValues: {
      employeeId: '',
      date: null,
      entryTime: '',
      exitTime: '',
      workedHours: '',
    },
  });
  const {
    formState: { dirtyFields },
  } = form;
  const attendanceId = useMemo(
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
    const submissionData = {
      ...data,
      date: data.date ? format(data.date, 'yyyy-MM-dd') : null,
    };

    if (attendanceId) {
      // edit → send only changed fields (PATCH)
      const changes = pickDirty(submissionData, dirtyFields);
      onSubmit({ id: attendanceId, body: changes });
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

  return { form, attendanceId, handleSubmit, handleDelete };
}

export const AttendanceDialog = ({
  openDialog,
  onCloseDialog,
  selectedRow,
  onSubmit,
  onDeleteById,
  actionDialog,
  dataEmployees,
}) => {
  const { t } = useTranslation();
  const { form, attendanceId, handleSubmit, handleDelete } =
    useAttendanceDialogForm({
      openDialog,
      selectedRow,
      onSubmit,
      onDeleteById,
    });

  const hasCreated = selectedRow?.createdOn && attendanceId;
  const hasUpdated = selectedRow?.updatedOn && attendanceId;

  return (
    <Dialog open={openDialog} onOpenChange={onCloseDialog}>
      <DialogContent className="sm:max-w-[600px]">
        {buildDialogHeader({ t, actionDialog, attendanceId })}
        <Form {...form}>
          <form
            method="post"
            action=""
            id="attendance-form"
            noValidate
            onSubmit={form.handleSubmit(handleSubmit)}
            className="flex flex-col flex-wrap gap-5"
          >
            {buildAttendanceFields({
              form,
              dataEmployees,
              hasCreated,
              hasUpdated,
            })}

            {buildDialogFooter({ t, attendanceId, handleDelete })}
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

AttendanceDialog.propTypes = {
  openDialog: PropTypes.bool.isRequired,
  onCloseDialog: PropTypes.func.isRequired,
  selectedRow: PropTypes.object,
  onSubmit: PropTypes.func.isRequired,
  onDeleteById: PropTypes.func.isRequired,
  actionDialog: PropTypes.string.isRequired,
  dataEmployees: PropTypes.array.isRequired,
};

import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import PropTypes from 'prop-types';

import { PayrollSchema, months } from '../utils'; // Import payroll schema

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
import { Calendar } from '@/components/ui/calendar'; // Keep for potential date fields if needed later
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { CalendarIcon } from '@radix-ui/react-icons'; // Using FileTextIcon for payroll
import { LuFile } from 'react-icons/lu';
import { pickDirty } from '@/utils/pickDirty';

/** Normalizes a raw row to form values (Selects need strings). */
const mapRowToFormValues = (row) => ({
  employeeId: row.employeeId,
  month: row.month?.toString(), // Ensure string for Select
  year: row.year?.toString(), // Ensure string for Select/Input
  baseSalary: row.baseSalary,
  extraHours: row.extraHours ?? '0', // Handle null/undefined
  deductions: row.deductions ?? '0', // Handle null/undefined
  totalPayment: row.totalPayment,
  createdOn: row.createdOn,
  updatedOn: row.updatedOn,
  userPayrollCreatedName: row.userPayrollCreatedName,
  userPayrollUpdatedName: row.userPayrollUpdatedName,
});

const EMPTY_FORM_VALUES = {
  employeeId: '',
  month: '', // Use string for Select component
  year: '', // Use string for Select component or Input type=number
  baseSalary: '',
  extraHours: '0',
  deductions: '0',
  totalPayment: '',
};

/** Converts form values to numeric submission data. */
const toSubmissionValues = (data) => ({
  ...data,
  month: Number(data.month),
  year: Number(data.year),
  baseSalary: Number(data.baseSalary),
  extraHours: Number(data.extraHours),
  deductions: Number(data.deductions),
  totalPayment: Number(data.totalPayment),
});

/** Employee select field. */
function PayrollEmployeeField({ control, dataEmployees }) {
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

PayrollEmployeeField.propTypes = {
  control: PropTypes.object.isRequired,
  dataEmployees: PropTypes.array.isRequired,
};

/** Month select field. */
function PayrollMonthField({ control }) {
  const { t } = useTranslation();
  return (
    <FormField
      control={control}
      name="month"
      render={({ field }) => (
        <FormItem>
          <FormLabel>{t('month')}*</FormLabel>
          <Select
            onValueChange={field.onChange}
            value={field.value?.toString() ?? ''}
          >
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder={t('select_month_placeholder')} />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {months.map((month) => (
                <SelectItem key={month.value} value={month.value}>
                  {month.label}
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

PayrollMonthField.propTypes = {
  control: PropTypes.object.isRequired,
};

/** Year numeric input field. */
function PayrollYearField({ control }) {
  const { t } = useTranslation();
  return (
    <FormField
      control={control}
      name="year"
      render={({ field }) => (
        <FormItem>
          <FormLabel>{t('year')}*</FormLabel>
          <Input
            id="year"
            name="year"
            placeholder={t('year_placeholder')}
            type="number"
            min="2000"
            {...field}
            value={field.value ?? ''}
          />

          <FormMessage />
        </FormItem>
      )}
    />
  );
}

PayrollYearField.propTypes = {
  control: PropTypes.object.isRequired,
};

/** Money/number input field (parametrized). */
function PayrollNumberField({
  control,
  name,
  labelKey,
  placeholderKey,
  emptyValue = '',
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
            {emptyValue ? '' : '*'}
          </FormLabel>
          <FormControl>
            <Input
              id={name}
              name={name}
              placeholder={t(placeholderKey)}
              type="number"
              step="0.01"
              min="0"
              {...field}
              value={field.value ?? emptyValue}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

PayrollNumberField.propTypes = {
  control: PropTypes.object.isRequired,
  name: PropTypes.string.isRequired,
  labelKey: PropTypes.string.isRequired,
  placeholderKey: PropTypes.string.isRequired,
  emptyValue: PropTypes.string,
};

/** Disabled text field for audit data (created/updated by). */
function PayrollReadonlyTextField({ control, name, labelKey }) {
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

PayrollReadonlyTextField.propTypes = {
  control: PropTypes.object.isRequired,
  name: PropTypes.string.isRequired,
  labelKey: PropTypes.string.isRequired,
};

/** Disabled date display with calendar popover (created/updated on). */
function PayrollReadonlyDateField({ control, name, labelKey }) {
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

PayrollReadonlyDateField.propTypes = {
  control: PropTypes.object.isRequired,
  name: PropTypes.string.isRequired,
  labelKey: PropTypes.string.isRequired,
};

/** Read-only audit pair: created/updated by + created/updated on. */
function buildAuditPair({ form, nameKey, dateKey, byLabelKey, onLabelKey }) {
  return (
    <>
      <PayrollReadonlyTextField
        control={form.control}
        name={nameKey}
        labelKey={byLabelKey}
      />
      <PayrollReadonlyDateField
        control={form.control}
        name={dateKey}
        labelKey={onLabelKey}
      />
    </>
  );
}

/** Grid of dialog form fields in display order. */
function buildPayrollFields({ form, dataEmployees, hasCreated, hasUpdated }) {
  return (
    <div className="grid grid-cols-2 gap-6 py-4 auto-rows-auto">
      {/* Employee Select */}
      <PayrollEmployeeField
        control={form.control}
        dataEmployees={dataEmployees}
      />

      {/* Month Select */}
      <PayrollMonthField control={form.control} />

      {/* Year Input/Select - Using Input for simplicity */}
      <PayrollYearField control={form.control} />

      {/* Base Salary */}
      <PayrollNumberField
        control={form.control}
        name="baseSalary"
        labelKey="base_salary"
        placeholderKey="base_salary_placeholder"
      />

      {/* Extra Hours */}
      <PayrollNumberField
        control={form.control}
        name="extraHours"
        labelKey="extra_hours"
        placeholderKey="extra_hours_placeholder"
        emptyValue="0"
      />

      {/* Deductions */}
      <PayrollNumberField
        control={form.control}
        name="deductions"
        labelKey="deductions"
        placeholderKey="deductions_placeholder"
        emptyValue="0"
      />

      {/* Total Payment */}
      <PayrollNumberField
        control={form.control}
        name="totalPayment"
        labelKey="total_payment"
        placeholderKey="total_payment_placeholder"
      />

      {/* Created By/On Fields */}
      {hasCreated &&
        buildAuditPair({
          form,
          nameKey: 'userPayrollCreatedName',
          dateKey: 'createdOn',
          byLabelKey: 'created_by',
          onLabelKey: 'created_on',
        })}

      {/* Updated By/On Fields */}
      {hasUpdated &&
        buildAuditPair({
          form,
          nameKey: 'userPayrollUpdatedName',
          dateKey: 'updatedOn',
          byLabelKey: 'updated_by',
          onLabelKey: 'updated_on',
        })}
    </div>
  );
}

/** Dialog header: file icon, action title and edit/add description. */
function buildDialogHeader({ t, actionDialog, payrollId }) {
  return (
    <DialogHeader>
      <DialogTitle className="flex items-center gap-2">
        <LuFile className="inline mr-3 w-7 h-7" />
        {actionDialog}
      </DialogTitle>
      <DialogDescription>
        {payrollId ? t('edit_message') : t('add_message')}
      </DialogDescription>
    </DialogHeader>
  );
}

/** Dialog footer: cancel, delete (edit only) and save/update. */
function buildDialogFooter({ t, payrollId, handleDelete }) {
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

      {payrollId && (
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
        {payrollId ? t('update') : t('save')}
      </Button>
    </DialogFooter>
  );
}

/**
 * Dialog form state: reset from the selected row, numeric conversion +
 * dirty-field PATCH payloads on edit.
 */
function usePayrollDialogForm({
  openDialog,
  selectedRow,
  onSubmit,
  onDeleteById,
}) {
  const form = useForm({
    resolver: zodResolver(PayrollSchema),
    defaultValues: EMPTY_FORM_VALUES,
  });
  const {
    formState: { dirtyFields },
  } = form;
  const payrollId = useMemo(() => selectedRow?.id ?? null, [selectedRow?.id]);

  useEffect(() => {
    if (selectedRow?.id) {
      form.reset(mapRowToFormValues(selectedRow));
    } else {
      form.reset(EMPTY_FORM_VALUES);
    }
  }, [selectedRow, openDialog, form]);

  const handleSubmit = (data) => {
    const submissionData = toSubmissionValues(data);
    if (payrollId) {
      // edit → send only changed fields (PATCH)
      const changes = pickDirty(submissionData, dirtyFields);
      onSubmit({ id: payrollId, body: changes });
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

  return { form, payrollId, handleSubmit, handleDelete };
}

export const PayrollDialog = ({
  openDialog,
  onCloseDialog,
  selectedRow,
  onSubmit,
  onDeleteById,
  actionDialog,
  dataEmployees,
}) => {
  const { t } = useTranslation();
  const { form, payrollId, handleSubmit, handleDelete } = usePayrollDialogForm({
    openDialog,
    selectedRow,
    onSubmit,
    onDeleteById,
  });

  const hasCreated = selectedRow?.createdOn && payrollId;
  const hasUpdated = selectedRow?.updatedOn && payrollId;

  return (
    <Dialog
      open={openDialog}
      onOpenChange={(isOpen) => {
        if (isOpen === true) return;
        onCloseDialog();
      }}
    >
      <DialogContent className="sm:max-w-[600px]">
        {buildDialogHeader({ t, actionDialog, payrollId })}
        <Form {...form}>
          <form
            method="post"
            action=""
            id="payroll-form"
            noValidate
            onSubmit={form.handleSubmit(handleSubmit)}
            className="flex flex-col flex-wrap gap-5"
          >
            {buildPayrollFields({
              form,
              dataEmployees,
              hasCreated,
              hasUpdated,
            })}

            {buildDialogFooter({ t, payrollId, handleDelete })}
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

PayrollDialog.propTypes = {
  openDialog: PropTypes.bool.isRequired,
  onCloseDialog: PropTypes.func.isRequired,
  selectedRow: PropTypes.object,
  onSubmit: PropTypes.func.isRequired,
  onDeleteById: PropTypes.func.isRequired,
  actionDialog: PropTypes.string.isRequired,
  dataEmployees: PropTypes.array.isRequired,
};

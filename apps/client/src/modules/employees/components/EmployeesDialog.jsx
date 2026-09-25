import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { pickDirty } from '@/utils/pickDirty';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import PropTypes from 'prop-types';

import { EmployeeSchema } from '../utils';

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
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { LuUsersRound } from 'react-icons/lu';
import { FIELD_LIMITS } from '@/config/fieldLimits';

/** Normalizes a raw row to form values (audit fields included). */
const mapRowToFormValues = (row) => ({
  name: row.name,
  lastName: row.lastName,
  dni: row.dni,
  email: row.email,
  phone: row.phone || '',
  address: row.address || '',
  startDate: row.startDate ? new Date(row.startDate) : new Date(),
  position: row.position,
  department: row.department,
  salary: row.salary.toString(),
  createdOn: row.createdOn,
  updatedOn: row.updatedOn,
  userEmployeeCreatedName: row.userEmployeeCreatedName || '',
  userEmployeeUpdatedName: row.userEmployeeUpdatedName || '',
});

/** Empty form values; `startDate` is evaluated at reset time. */
const getEmptyFormValues = () => ({
  name: '',
  lastName: '',
  dni: '',
  email: '',
  phone: '',
  address: '',
  startDate: new Date(),
  position: '',
  department: '',
  salary: '',
  createdOn: '',
  updatedOn: '',
  userEmployeeCreatedName: '',
  userEmployeeUpdatedName: '',
});

/** Text input field (parametrized name/label/placeholder/type). */
function EmployeeTextField({
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
              maxLength={FIELD_LIMITS.employees[name]}
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

EmployeeTextField.propTypes = {
  control: PropTypes.object.isRequired,
  name: PropTypes.string.isRequired,
  labelKey: PropTypes.string.isRequired,
  placeholderKey: PropTypes.string.isRequired,
  type: PropTypes.string,
  required: PropTypes.bool,
};

/** Salary numeric input (decimals allowed, no max length). */
function EmployeeSalaryField({ control }) {
  const { t } = useTranslation();
  return (
    <FormField
      control={control}
      name="salary"
      render={({ field }) => (
        <FormItem>
          <FormLabel htmlFor="salary">{t('salary')}*</FormLabel>
          <FormControl>
            <Input
              id="salary"
              name="salary"
              placeholder={t('employee_salary_placeholder')}
              type="number"
              autoComplete="off"
              min="0"
              step="0.01"
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

EmployeeSalaryField.propTypes = {
  control: PropTypes.object.isRequired,
};

/** Start date picker (dates before 1900 disabled). */
function EmployeeStartDateField({ control }) {
  const { t } = useTranslation();
  return (
    <FormField
      control={control}
      name="startDate"
      render={({ field }) => (
        <FormItem className="flex flex-col">
          <FormLabel>{t('start_date')}*</FormLabel>
          <Popover>
            <PopoverTrigger asChild>
              <FormControl>
                <Button
                  variant={'outline'}
                  className={cn(
                    'pl-3 text-left font-normal',
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
                disabled={(date) => date < new Date('1900-01-01')}
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

EmployeeStartDateField.propTypes = {
  control: PropTypes.object.isRequired,
};

/** Disabled text field for audit data (created/updated by). */
function EmployeeReadonlyTextField({ control, name, labelKey }) {
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

EmployeeReadonlyTextField.propTypes = {
  control: PropTypes.object.isRequired,
  name: PropTypes.string.isRequired,
  labelKey: PropTypes.string.isRequired,
};

/** Disabled date display with calendar popover (created/updated on). */
function EmployeeReadonlyDateField({ control, name, labelKey }) {
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

EmployeeReadonlyDateField.propTypes = {
  control: PropTypes.object.isRequired,
  name: PropTypes.string.isRequired,
  labelKey: PropTypes.string.isRequired,
};

/** Text fields rendered before the start-date picker. */
const TOP_TEXT_FIELDS = [
  {
    name: 'name',
    labelKey: 'name',
    placeholderKey: 'employee_name_placeholder',
    required: true,
  },
  {
    name: 'lastName',
    labelKey: 'last_name',
    placeholderKey: 'last_name_placeholder',
    required: true,
  },
  {
    name: 'dni',
    labelKey: 'dni',
    placeholderKey: 'dni_placeholder',
    required: true,
  },
  {
    name: 'email',
    labelKey: 'email',
    placeholderKey: 'employee_email_placeholder',
    type: 'email',
    required: true,
  },
  {
    name: 'phone',
    labelKey: 'phone',
    placeholderKey: 'employee_phone_placeholder',
    type: 'tel',
  },
  {
    name: 'address',
    labelKey: 'address',
    placeholderKey: 'employee_address_placeholder',
  },
];

/** Text fields rendered between the start-date picker and salary. */
const BOTTOM_TEXT_FIELDS = [
  {
    name: 'position',
    labelKey: 'position',
    placeholderKey: 'employee_position_placeholder',
    required: true,
  },
  {
    name: 'department',
    labelKey: 'department',
    placeholderKey: 'employee_department_placeholder',
    required: true,
  },
];

/** Renders a list of text-field definitions in order. */
const renderTextFields = (form, defs) =>
  defs.map((def) => (
    <EmployeeTextField key={def.name} control={form.control} {...def} />
  ));

/** Read-only audit pair: created/updated by + created/updated on. */
function buildAuditPair({ form, nameKey, dateKey, byLabelKey, onLabelKey }) {
  return (
    <>
      <EmployeeReadonlyTextField
        control={form.control}
        name={nameKey}
        labelKey={byLabelKey}
      />
      <EmployeeReadonlyDateField
        control={form.control}
        name={dateKey}
        labelKey={onLabelKey}
      />
    </>
  );
}

/** Grid of dialog form fields in display order. */
function buildEmployeeFields({ form, hasCreated, hasUpdated }) {
  return (
    <div className="grid grid-cols-2 gap-6 py-4 auto-rows-auto">
      {renderTextFields(form, TOP_TEXT_FIELDS)}
      <EmployeeStartDateField control={form.control} />
      {renderTextFields(form, BOTTOM_TEXT_FIELDS)}
      <EmployeeSalaryField control={form.control} />

      {/* Created By/On Fields */}
      {hasCreated &&
        buildAuditPair({
          form,
          nameKey: 'userEmployeeCreatedName',
          dateKey: 'createdOn',
          byLabelKey: 'created_by',
          onLabelKey: 'created_on',
        })}

      {/* Updated By/On Fields */}
      {hasUpdated &&
        buildAuditPair({
          form,
          nameKey: 'userEmployeeUpdatedName',
          dateKey: 'updatedOn',
          byLabelKey: 'updated_by',
          onLabelKey: 'updated_on',
        })}
    </div>
  );
}

/** Dialog header: users icon, action title and edit/add description. */
function buildDialogHeader({ t, actionDialog, employeeId }) {
  return (
    <DialogHeader>
      <DialogTitle className="flex items-center gap-2">
        <LuUsersRound className="inline mr-3 w-7 h-7" />
        {actionDialog}
      </DialogTitle>
      <DialogDescription>
        {employeeId ? t('edit_message') : t('add_message')}
      </DialogDescription>
    </DialogHeader>
  );
}

/** Dialog footer: cancel, delete (edit only) and save/update. */
function buildDialogFooter({ t, employeeId, handleDelete }) {
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

      {employeeId && (
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
        {employeeId ? t('update') : t('save')}
      </Button>
    </DialogFooter>
  );
}

/**
 * Dialog form state: reset from the selected row, dirty-field PATCH
 * payloads on edit.
 */
function useEmployeeDialogForm({
  openDialog,
  selectedRow,
  onSubmit,
  onDeleteById,
}) {
  const form = useForm({
    resolver: zodResolver(EmployeeSchema),
    defaultValues: getEmptyFormValues(),
  });
  const {
    formState: { dirtyFields },
  } = form;
  const employeeId = useMemo(() => selectedRow?.id ?? null, [selectedRow?.id]);

  // Actualiza todos los valores del formulario al cambiar `selectedRow`
  useEffect(() => {
    if (selectedRow?.id) {
      // Filtra y mapea solo los valores necesarios
      form.reset(mapRowToFormValues(selectedRow));
    }

    if (!openDialog) {
      form.reset(getEmptyFormValues());
    }
  }, [selectedRow, openDialog, form]);

  const handleSubmit = (data) => {
    if (employeeId) {
      // edit → send only changed fields (PATCH)
      const changes = pickDirty(data, dirtyFields);
      onSubmit({ id: employeeId, body: changes });
    } else {
      // create → send all fields (POST)
      onSubmit(data);
    }
  };

  const handleDelete = () => {
    if (selectedRow?.id) {
      onDeleteById(selectedRow.id);
    }
  };

  return { form, employeeId, handleSubmit, handleDelete };
}

export const EmployeesDialog = ({
  openDialog,
  onCloseDialog,
  selectedRow,
  onSubmit,
  onDeleteById,
  actionDialog,
}) => {
  const { t } = useTranslation();
  const { form, employeeId, handleSubmit, handleDelete } =
    useEmployeeDialogForm({ openDialog, selectedRow, onSubmit, onDeleteById });

  const hasCreated = selectedRow?.createdOn && employeeId;
  const hasUpdated = selectedRow?.updatedOn && employeeId;

  return (
    <Dialog open={openDialog} onOpenChange={onCloseDialog}>
      <DialogContent className="sm:max-w-[600px]">
        {buildDialogHeader({ t, actionDialog, employeeId })}
        <Form {...form}>
          <form
            method="post"
            action=""
            id="employee-form"
            noValidate
            onSubmit={form.handleSubmit(handleSubmit)}
            className="flex flex-col flex-wrap gap-5"
          >
            {buildEmployeeFields({ form, hasCreated, hasUpdated })}
            {buildDialogFooter({ t, employeeId, handleDelete })}
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

EmployeesDialog.propTypes = {
  openDialog: PropTypes.bool.isRequired,
  onCloseDialog: PropTypes.func.isRequired,
  selectedRow: PropTypes.object,
  onSubmit: PropTypes.func.isRequired,
  onDeleteById: PropTypes.func.isRequired,
  actionDialog: PropTypes.string.isRequired,
};

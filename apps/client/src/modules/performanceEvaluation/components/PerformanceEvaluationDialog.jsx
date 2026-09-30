import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import PropTypes from 'prop-types';
import { pickDirty } from '@/utils/pickDirty';
import { FIELD_LIMITS } from '@/config/fieldLimits';

import {
  PerformanceEvaluationSchema,
  PerformanceEvaluationCalidation,
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
import { CalendarIcon, StarIcon } from '@radix-ui/react-icons'; // Using StarIcon

/** Normalizes a raw row to form values (date as Date, calification as string). */
const mapRowToFormValues = (row) => ({
  employeeId: row.employeeId,
  date: row.date ? new Date(row.date) : null,
  calification: row.calification?.toString(), // Ensure string
  comments: row.comments ?? '',
  createdOn: row.createdOn,
  updatedOn: row.updatedOn,
  userPerformanceCreatedName: row.userPerformanceCreatedName,
  userPerformanceUpdatedName: row.userPerformanceUpdatedName,
});

const EMPTY_FORM_VALUES = {
  employeeId: '',
  date: undefined,
  calification: '',
  comments: '',
};

/** Converts form values for submission (date ISO, calification number). */
const toSubmissionValues = (data) => ({
  ...data,
  date: data.date ? format(data.date, 'yyyy-MM-dd') : null,
  calification: Number(data.calification),
});

/** Employee select field. */
function EvaluationEmployeeField({ control, dataEmployees }) {
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

EvaluationEmployeeField.propTypes = {
  control: PropTypes.object.isRequired,
  dataEmployees: PropTypes.array.isRequired,
};

/** Evaluation date picker (past dates only). */
function EvaluationDateField({ control }) {
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

EvaluationDateField.propTypes = {
  control: PropTypes.object.isRequired,
};

/** Calification select for predefined scores. */
function EvaluationCalificationField({ control }) {
  const { t } = useTranslation();
  return (
    <FormField
      control={control}
      name="calification"
      render={({ field }) => (
        <FormItem>
          <FormLabel>{t('calification')}*</FormLabel>
          {/* Using Select for predefined scores */}
          <Select
            onValueChange={field.onChange}
            value={field.value?.toString() ?? ''}
          >
            <FormControl>
              <SelectTrigger>
                <SelectValue
                  placeholder={t('select_calification_placeholder')}
                />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {PerformanceEvaluationCalidation.map((option) => (
                <SelectItem key={option.value} value={option.value.toString()}>
                  {option.label}
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

EvaluationCalificationField.propTypes = {
  control: PropTypes.object.isRequired,
};

/** Comments textarea spanning the grid. */
function EvaluationCommentsField({ control }) {
  const { t } = useTranslation();
  return (
    <FormField
      control={control}
      name="comments"
      render={({ field }) => (
        <FormItem className="col-span-2">
          {' '}
          {/* Span across two columns */}
          <FormLabel htmlFor="comments">{t('comments')}</FormLabel>
          <FormControl>
            <Textarea
              id="comments"
              name="comments"
              placeholder={t('evaluation_comments_placeholder')}
              maxLength={FIELD_LIMITS.performanceEvaluation.comments}
              rows={4}
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

EvaluationCommentsField.propTypes = {
  control: PropTypes.object.isRequired,
};

/** Disabled text field for audit data (created/updated by). */
function EvaluationReadonlyTextField({ control, name, labelKey }) {
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

EvaluationReadonlyTextField.propTypes = {
  control: PropTypes.object.isRequired,
  name: PropTypes.string.isRequired,
  labelKey: PropTypes.string.isRequired,
};

/** Disabled date display with calendar popover (created/updated on). */
function EvaluationReadonlyDateField({ control, name, labelKey }) {
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

EvaluationReadonlyDateField.propTypes = {
  control: PropTypes.object.isRequired,
  name: PropTypes.string.isRequired,
  labelKey: PropTypes.string.isRequired,
};

/** Read-only audit pair: created/updated by + created/updated on. */
function buildAuditPair({ form, nameKey, dateKey, byLabelKey, onLabelKey }) {
  return (
    <>
      <EvaluationReadonlyTextField
        control={form.control}
        name={nameKey}
        labelKey={byLabelKey}
      />
      <EvaluationReadonlyDateField
        control={form.control}
        name={dateKey}
        labelKey={onLabelKey}
      />
    </>
  );
}

/** Grid of dialog form fields in display order. */
function buildEvaluationFields({
  form,
  dataEmployees,
  hasCreated,
  hasUpdated,
}) {
  return (
    <div className="grid grid-cols-2 gap-6 py-4 auto-rows-auto">
      {/* Employee Select */}
      <EvaluationEmployeeField
        control={form.control}
        dataEmployees={dataEmployees}
      />

      {/* Date Picker */}
      <EvaluationDateField control={form.control} />

      {/* Calification Select/Input */}
      <EvaluationCalificationField control={form.control} />

      {/* Comments Textarea */}
      <EvaluationCommentsField control={form.control} />

      {/* Created By/On Fields */}
      {hasCreated &&
        buildAuditPair({
          form,
          nameKey: 'userPerformanceCreatedName',
          dateKey: 'createdOn',
          byLabelKey: 'created_by',
          onLabelKey: 'created_on',
        })}

      {/* Updated By/On Fields */}
      {hasUpdated &&
        buildAuditPair({
          form,
          nameKey: 'userPerformanceUpdatedName',
          dateKey: 'updatedOn',
          byLabelKey: 'updated_by',
          onLabelKey: 'updated_on',
        })}
    </div>
  );
}

/** Dialog header: star icon, action title and edit/add description. */
function buildDialogHeader({ t, actionDialog, evaluationId }) {
  return (
    <DialogHeader>
      <DialogTitle className="flex items-center gap-2">
        <StarIcon className="inline mr-3 w-7 h-7" /> {/* Changed Icon */}
        {actionDialog}
      </DialogTitle>
      <DialogDescription>
        {evaluationId
          ? t('edit_evaluation_message')
          : t('add_evaluation_message')}
      </DialogDescription>
    </DialogHeader>
  );
}

/** Dialog footer: cancel, delete (edit only) and save/update. */
function buildDialogFooter({ t, evaluationId, handleDelete }) {
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

      {evaluationId && (
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
        {evaluationId ? t('update') : t('save')}
      </Button>
    </DialogFooter>
  );
}

/**
 * Dialog form state: reset from the selected row, date/calification
 * conversion + dirty-field PATCH payloads on edit.
 */
function useEvaluationDialogForm({
  openDialog,
  selectedRow,
  onSubmit,
  onDeleteById,
}) {
  const form = useForm({
    resolver: zodResolver(PerformanceEvaluationSchema),
    defaultValues: EMPTY_FORM_VALUES,
  });
  const {
    formState: { dirtyFields },
  } = form;

  const evaluationId = useMemo(
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
    if (evaluationId) {
      // edit → send only changed fields (PATCH)
      const changes = pickDirty(submissionData, dirtyFields);
      onSubmit({ id: evaluationId, body: changes });
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

  return { form, evaluationId, handleSubmit, handleDelete };
}

export const PerformanceEvaluationDialog = ({
  openDialog,
  onCloseDialog,
  selectedRow,
  onSubmit,
  onDeleteById,
  actionDialog,
  dataEmployees,
}) => {
  const { t } = useTranslation();
  const { form, evaluationId, handleSubmit, handleDelete } =
    useEvaluationDialogForm({
      openDialog,
      selectedRow,
      onSubmit,
      onDeleteById,
    });

  const hasCreated = selectedRow?.createdOn && evaluationId;
  const hasUpdated = selectedRow?.updatedOn && evaluationId;

  return (
    <Dialog open={openDialog} onOpenChange={onCloseDialog}>
      <DialogContent className="sm:max-w-[600px]">
        {buildDialogHeader({ t, actionDialog, evaluationId })}
        <Form {...form}>
          <form
            method="post"
            action=""
            id="evaluation-form"
            noValidate
            onSubmit={form.handleSubmit(handleSubmit)}
            className="flex flex-col flex-wrap gap-5"
          >
            {buildEvaluationFields({
              form,
              dataEmployees,
              hasCreated,
              hasUpdated,
            })}

            {buildDialogFooter({ t, evaluationId, handleDelete })}
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

PerformanceEvaluationDialog.propTypes = {
  openDialog: PropTypes.bool.isRequired,
  onCloseDialog: PropTypes.func.isRequired,
  selectedRow: PropTypes.object,
  onSubmit: PropTypes.func.isRequired,
  onDeleteById: PropTypes.func.isRequired,
  actionDialog: PropTypes.string.isRequired,
  dataEmployees: PropTypes.array.isRequired, // Pass employee data
};

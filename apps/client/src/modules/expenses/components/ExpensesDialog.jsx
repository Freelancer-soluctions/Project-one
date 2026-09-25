import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { pickDirty } from '@/utils/pickDirty';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'; // Added for status field
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';

import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon } from '@radix-ui/react-icons';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { LuTrendingDown } from 'react-icons/lu'; // Changed icon
import PropTypes from 'prop-types';
import { ExpenseSchema, expenseCategories } from '../utils';
import { FIELD_LIMITS } from '@/config/fieldLimits';

/** Normalizes a raw row to form values (audit names from object or string). */
const mapRowToFormValues = (row) => ({
  description: row.description,
  total: row.total,
  category: row.category,
  createdOn: row.createdOn,
  updatedOn: row.updatedOn,
  // Adapt these if the related user data comes differently for expenses
  userExpenseCreatedName:
    row.userExpenseCreated?.name || row.userExpenseCreatedName || '',
  userExpenseUpdatedName:
    row.userExpenseUpdated?.name || row.userExpenseUpdatedName || '',
});

const EMPTY_FORM_VALUES = {
  description: '',
  total: '',
  category: '',
};

/** Converts the total string to a number for submission. */
const toSubmissionValues = (data) => ({
  ...data,
  total: parseFloat(data.total) || 0,
});

/** Total numeric input field. */
function ExpenseTotalField({ control }) {
  const { t } = useTranslation();
  return (
    <FormField
      control={control}
      name="total"
      render={({ field }) => (
        <FormItem>
          <FormLabel htmlFor="total">{t('total')}*</FormLabel>
          <FormControl>
            <Input
              id="total"
              name="total"
              placeholder={t('total_placeholder')}
              type="number" // Changed to number
              step="0.01" // For float values
              autoComplete="off"
              {...field}
              value={field.value ?? ''}
              onChange={(e) => field.onChange(parseFloat(e.target.value) || '')} // Ensure value is number
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

ExpenseTotalField.propTypes = {
  control: PropTypes.object.isRequired,
};

/** Category select fed from the expense categories enum. */
function ExpenseCategoryField({ control }) {
  const { t } = useTranslation();
  return (
    <FormField
      control={control}
      name="category"
      render={({ field }) => (
        <FormItem>
          <FormLabel htmlFor="category">{t('category')}*</FormLabel>
          <Select
            onValueChange={field.onChange}
            defaultValue={field.value}
            value={field.value}
          >
            <FormControl>
              <SelectTrigger id="category">
                <SelectValue placeholder={t('select_category')} />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {expenseCategories.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {t(cat.labelKey)}
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

ExpenseCategoryField.propTypes = {
  control: PropTypes.object.isRequired,
};

/** Description textarea spanning the grid. */
function ExpenseDescriptionField({ control }) {
  const { t } = useTranslation();
  return (
    <FormField
      control={control}
      name="description"
      render={({ field }) => (
        <FormItem className="flex flex-col flex-auto col-span-2">
          <FormLabel htmlFor="description">{t('description')}*</FormLabel>
          <FormControl>
            <Textarea
              type="textarea"
              id="description"
              placeholder={t('description_placeholder')}
              className="resize-none"
              maxLength={FIELD_LIMITS.expenses.description}
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

ExpenseDescriptionField.propTypes = {
  control: PropTypes.object.isRequired,
};

/** Disabled audit field pair: user name + readonly date popover. */
function ExpenseAuditFieldPair({
  control,
  nameKey,
  dateKey,
  labelKey,
  dateLabelKey,
}) {
  const { t } = useTranslation();
  return (
    <>
      <FormField
        control={control}
        name={nameKey}
        render={({ field }) => (
          <FormItem>
            <FormLabel htmlFor={nameKey}>{t(labelKey)}</FormLabel>
            <FormControl>
              <Input
                id={nameKey}
                name={nameKey}
                disabled
                {...field}
                value={field.value ?? ''}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name={dateKey}
        render={({ field }) => (
          <FormItem className="flex flex-col flex-auto">
            <FormLabel htmlFor={dateKey}>{t(dateLabelKey)}</FormLabel>
            <Popover>
              <PopoverTrigger asChild>
                <FormControl>
                  <Button
                    id={dateKey}
                    disabled={true}
                    variant={'outline'}
                    className={cn(
                      'pl-3 text-left font-normal',
                      !field.value && 'text-muted-foreground'
                    )}
                  >
                    {field.value ? (
                      format(new Date(field.value), 'PPP')
                    ) : (
                      <span>{t('select_date')}</span>
                    )}
                    <CalendarIcon className="w-4 h-4 ml-auto opacity-50" />
                  </Button>
                </FormControl>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={field.value ? new Date(field.value) : null}
                  onSelect={field.onChange}
                  disabled={true} // Dates are usually not editable here
                />
              </PopoverContent>
            </Popover>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
}

ExpenseAuditFieldPair.propTypes = {
  control: PropTypes.object.isRequired,
  nameKey: PropTypes.string.isRequired,
  dateKey: PropTypes.string.isRequired,
  labelKey: PropTypes.string.isRequired,
  dateLabelKey: PropTypes.string.isRequired,
};

/** Grid of dialog form fields in display order. */
function buildExpenseFields({ form, hasCreated, hasUpdated }) {
  return (
    <div className="grid grid-cols-1 gap-6 py-4 md:grid-cols-2 auto-rows-auto">
      <ExpenseTotalField control={form.control} />

      <ExpenseCategoryField control={form.control} />

      <ExpenseDescriptionField control={form.control} />

      {/* Fields for createdOn, updatedOn, etc. - adapting from ClientsDialog */}
      {hasCreated && (
        <ExpenseAuditFieldPair
          control={form.control}
          nameKey="userExpenseCreatedName"
          dateKey="createdOn"
          labelKey="created_by"
          dateLabelKey="created_on"
        />
      )}
      {hasUpdated && (
        <ExpenseAuditFieldPair
          control={form.control}
          nameKey="userExpenseUpdatedName"
          dateKey="updatedOn"
          labelKey="updated_by"
          dateLabelKey="updated_on"
        />
      )}
    </div>
  );
}

/** Dialog header: trending-down icon, action title and description. */
function buildDialogHeader({ t, actionDialog, expenseId }) {
  return (
    <DialogHeader>
      <DialogTitle className="flex items-center gap-2">
        <LuTrendingDown className="inline mr-3 w-7 h-7" /> {/* Changed icon */}
        {actionDialog}
      </DialogTitle>
      <DialogDescription>
        {expenseId ? t('edit_expense_message') : t('add_expense_message')}{' '}
        {/* Adapted messages */}
      </DialogDescription>
    </DialogHeader>
  );
}

/** Dialog footer: cancel, delete (edit only) and save/update. */
function buildDialogFooter({ t, expenseId, handleDelete }) {
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

      {expenseId && (
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
        {expenseId ? t('update') : t('save')}
      </Button>
    </DialogFooter>
  );
}

/**
 * Dialog form state: reset from the selected row, numeric total +
 * dirty-field PATCH payloads on edit.
 */
function useExpenseDialogForm({
  openDialog,
  selectedRow,
  onSubmit,
  onDeleteById,
}) {
  const form = useForm({
    resolver: zodResolver(ExpenseSchema), // Changed from ClientSchema
    defaultValues: EMPTY_FORM_VALUES,
  });
  const {
    formState: { dirtyFields },
  } = form;

  const expenseId = useMemo(() => selectedRow?.id, [selectedRow?.id]);

  // Actualiza todos los valores del formulario al cambiar `selectedRow`
  useEffect(() => {
    if (selectedRow?.id) {
      form.reset(mapRowToFormValues(selectedRow));
    } else if (!openDialog) {
      // Changed logic to reset only if not openDialog and no selectedRow
      form.reset(EMPTY_FORM_VALUES);
    }
  }, [selectedRow, openDialog, form]); // Added form to dependency array as per react-hook-form's recommendation

  const handleSubmit = (data) => {
    const dataToSubmit = toSubmissionValues(data);

    if (expenseId) {
      // edit → send only changed fields (PATCH)
      const changes = pickDirty(dataToSubmit, dirtyFields);
      onSubmit({ id: expenseId, body: changes });
    } else {
      // create → send all fields (POST)
      onSubmit(dataToSubmit);
    }
  };

  const handleDelete = () => {
    onDeleteById(selectedRow.id);
  };

  return { form, expenseId, handleSubmit, handleDelete };
}

export const ExpensesDialog = ({
  // Renamed from ClientsDialog
  openDialog,
  onCloseDialog,
  selectedRow,
  onSubmit,
  onDeleteById,
  actionDialog,
}) => {
  const { t } = useTranslation();
  const { form, expenseId, handleSubmit, handleDelete } = useExpenseDialogForm({
    openDialog,
    selectedRow,
    onSubmit,
    onDeleteById,
  });

  const hasCreated = selectedRow?.createdOn && expenseId;
  const hasUpdated = selectedRow?.updatedOn && expenseId;

  return (
    <Dialog open={openDialog} onOpenChange={onCloseDialog}>
      <DialogContent className="sm:max-w-[600px]">
        {buildDialogHeader({ t, actionDialog, expenseId })}
        <Form {...form}>
          <form
            method="post"
            action=""
            id="expense-form" // Changed id
            noValidate
            onSubmit={form.handleSubmit(handleSubmit)}
            className="flex flex-col flex-wrap gap-5"
          >
            {buildExpenseFields({ form, hasCreated, hasUpdated })}

            {buildDialogFooter({ t, expenseId, handleDelete })}
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

ExpensesDialog.propTypes = {
  // Renamed from ClientsDialog
  openDialog: PropTypes.bool.isRequired,
  onCloseDialog: PropTypes.func.isRequired,
  selectedRow: PropTypes.object,
  onSubmit: PropTypes.func.isRequired,
  onDeleteById: PropTypes.func.isRequired,
  actionDialog: PropTypes.string.isRequired,
};

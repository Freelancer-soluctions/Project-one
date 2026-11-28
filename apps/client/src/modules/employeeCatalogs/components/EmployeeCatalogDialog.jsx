import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { zodResolver } from '@hookform/resolvers/zod';
import { LuBriefcase, LuBuilding2 } from 'react-icons/lu';
import PropTypes from 'prop-types';

import { EmployeeCatalogSchema } from '../utils';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const EMPTY_FORM_VALUES = { code: '', name: '', active: true };

/** Normalizes a row to form values. */
const mapRowToFormValues = (row) => ({
  code: row.code ?? '',
  name: row.name ?? '',
  active: row.active ?? true,
});

/** Text field for code / name (max length mirrors the Prisma schema). */
function CatalogTextField({ control, name, labelKey }) {
  const { t } = useTranslation();
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel htmlFor={`catalog-${name}`}>
            {t(labelKey)}
            {'*'}
          </FormLabel>
          <FormControl>
            <Input
              id={`catalog-${name}`}
              name={name}
              placeholder={t(`catalog_${name}_placeholder`)}
              type="text"
              autoComplete="off"
              maxLength={FIELD_LIMITS.employeeCatalogs[name]}
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

CatalogTextField.propTypes = {
  control: PropTypes.object.isRequired,
  name: PropTypes.string.isRequired,
  labelKey: PropTypes.string.isRequired,
};

/** Active/inactive select (string values mapped back to booleans). */
function CatalogStatusField({ control }) {
  const { t } = useTranslation();
  return (
    <FormField
      control={control}
      name="active"
      render={({ field }) => (
        <FormItem>
          <FormLabel htmlFor="catalog-active">
            {t('status')}
            {'*'}
          </FormLabel>
          <Select
            onValueChange={(value) => field.onChange(value === 'true')}
            value={String(field.value)}
          >
            <FormControl>
              <SelectTrigger id="catalog-active" className="w-full">
                <SelectValue placeholder={t('select_status')} />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              <SelectItem value="true">{t('active')}</SelectItem>
              <SelectItem value="false">{t('inactive')}</SelectItem>
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

CatalogStatusField.propTypes = {
  control: PropTypes.object.isRequired,
};

/** Dialog header: catalog icon, action title and add/edit description. */
function buildDialogHeader({ t, actionDialog, catalogId, Icon }) {
  return (
    <DialogHeader>
      <DialogTitle className="flex items-center gap-2">
        <Icon className="inline mr-3 w-7 h-7" />
        {actionDialog}
      </DialogTitle>
      <DialogDescription>
        {catalogId ? t('edit_message') : t('add_message')}
      </DialogDescription>
    </DialogHeader>
  );
}

/** Dialog footer: cancel, delete (edit only) and save. */
function buildDialogFooter({ t, catalogId, handleDelete }) {
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
      {catalogId && (
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
        {catalogId ? t('update') : t('save')}
      </Button>
    </DialogFooter>
  );
}

/** Dialog form state: reset from the selected row, id-aware submit. */
function useCatalogDialogForm({
  openDialog,
  selectedRow,
  onSubmit,
  onDeleteById,
}) {
  const form = useForm({
    resolver: zodResolver(EmployeeCatalogSchema),
    defaultValues: EMPTY_FORM_VALUES,
  });
  const catalogId = useMemo(() => selectedRow?.id ?? null, [selectedRow?.id]);

  useEffect(() => {
    if (selectedRow?.id) {
      form.reset(mapRowToFormValues(selectedRow));
    }

    if (!openDialog) {
      form.reset(EMPTY_FORM_VALUES);
    }
  }, [selectedRow, openDialog, form]);

  const handleSubmit = (data) => {
    if (catalogId) {
      onSubmit({ id: catalogId, body: data });
    } else {
      onSubmit(data);
    }
  };

  const handleDelete = () => {
    if (catalogId) {
      onDeleteById(catalogId);
    }
  };

  return { form, catalogId, handleSubmit, handleDelete };
}

export const EmployeeCatalogDialog = ({
  kind,
  openDialog,
  onCloseDialog,
  selectedRow,
  onSubmit,
  onDeleteById,
  actionDialog,
}) => {
  const { t } = useTranslation();
  const { form, catalogId, handleSubmit, handleDelete } = useCatalogDialogForm({
    openDialog,
    selectedRow,
    onSubmit,
    onDeleteById,
  });
  const Icon = kind === 'position' ? LuBriefcase : LuBuilding2;

  return (
    <Dialog open={openDialog} onOpenChange={onCloseDialog}>
      <DialogContent className="sm:max-w-[500px]">
        {buildDialogHeader({ t, actionDialog, catalogId, Icon })}
        <Form {...form}>
          <form
            method="post"
            action=""
            id={`${kind}-form`}
            noValidate
            onSubmit={form.handleSubmit(handleSubmit)}
            className="flex flex-col flex-wrap gap-5"
          >
            <div className="grid grid-cols-2 gap-6 py-4 auto-rows-auto">
              <CatalogTextField
                control={form.control}
                name="code"
                labelKey="code"
              />
              <CatalogTextField
                control={form.control}
                name="name"
                labelKey="name"
              />
              <CatalogStatusField control={form.control} />
            </div>
            {buildDialogFooter({ t, catalogId, handleDelete })}
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

EmployeeCatalogDialog.propTypes = {
  kind: PropTypes.oneOf(['position', 'department']).isRequired,
  openDialog: PropTypes.bool.isRequired,
  onCloseDialog: PropTypes.func.isRequired,
  selectedRow: PropTypes.object,
  onSubmit: PropTypes.func.isRequired,
  onDeleteById: PropTypes.func.isRequired,
  actionDialog: PropTypes.string.isRequired,
};

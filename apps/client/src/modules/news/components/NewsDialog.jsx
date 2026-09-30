import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { pickDirty } from '@/utils/pickDirty';
import { NewsDialogSchema, NewsStatusCode } from '../utils';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { LuNewspaper } from 'react-icons/lu';
import { useTranslation } from 'react-i18next';
import PropTypes from 'prop-types';

/**
 * Normaliza una fecha ISO a 'yyyy-MM-dd' (cadena vacía si es falsy).
 *
 * @param {string|Date} [date] - Fecha a normalizar.
 * @returns {string} Fecha en formato ISO corto o ''.
 */
const toISODateOrEmpty = (date) =>
  date ? new Date(date).toISOString().split('T')[0] : '';

/**
 * Mapea la fila seleccionada a los valores del formulario del diálogo.
 *
 * @param {Object} row - Fila seleccionada (registro de news).
 * @returns {Object} Valores listos para formDialog.reset().
 */
const mapSelectedRowToFormValues = (row) => ({
  description: row.description || '',
  document: row.document || '',
  createdOn: toISODateOrEmpty(row.createdOn),
  createdBy: row.createdBy || '',
  closedOn: toISODateOrEmpty(row.closedOn),
  status: row.status || {},
  userNewsCreated: row.userNewsCreated?.name || '',
  userNewsClosed: row.userNewsClosed?.name || '',
  userNewsPending: row.userNewsPending?.name || '',
});

/** Document (file) field; locked once the news is closed. */
function NewsDocumentField({ control, isClosed }) {
  const { t } = useTranslation();
  return (
    <FormField
      control={control}
      name="document"
      render={() => (
        <FormItem className="flex flex-col flex-auto col-span-1">
          <FormLabel htmlFor="file">{t('document')}</FormLabel>
          <FormControl>
            <Input id="file" name="document" type="file" disabled={isClosed} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

NewsDocumentField.propTypes = {
  control: PropTypes.object.isRequired,
  isClosed: PropTypes.bool.isRequired,
};

/** Status select; hides CLOSED for new records and locks when closed. */
function NewsStatusField({ control, datastatus, newId, isClosed }) {
  const { t } = useTranslation();
  return (
    <FormField
      control={control}
      name="status"
      render={({ field }) => {
        // extract only the neccessary status
        const dataStatus = !newId
          ? datastatus?.data.filter(
              (item) => item.code !== NewsStatusCode.CLOSED
            )
          : [...(datastatus?.data ?? [])];

        return (
          <FormItem className="flex flex-col flex-auto">
            <FormLabel htmlFor="status">{t('status')}*</FormLabel>
            <Select
              id="status"
              disabled={isClosed}
              onValueChange={(value) => {
                // Buscar el objeto completo por el `code`
                const selectedStatus = dataStatus.find(
                  (item) => item.code === value
                );
                if (selectedStatus) {
                  field.onChange(selectedStatus); // Asignar el objeto completo
                }
              }}
              // Usar el `code` del objeto seleccionado para mantener consistencia
              value={field.value?.code}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder={t('select_status')} />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {dataStatus.map((item, index) => (
                  <SelectItem value={item.code} key={index}>
                    {item.description}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
}

NewsStatusField.propTypes = {
  control: PropTypes.object.isRequired,
  datastatus: PropTypes.object,
  newId: PropTypes.number,
  isClosed: PropTypes.bool.isRequired,
};

/** Read-only text field for audit data (created by / closed by). */
function NewsReadonlyTextField({ control, name, label }) {
  const { t } = useTranslation();
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className="flex flex-col flex-auto col-span-1">
          <FormLabel htmlFor={name}>{t(label)}</FormLabel>
          <FormControl>
            <Input
              id={name}
              name={name}
              type="text"
              autoComplete="false"
              readOnly={true}
              disabled={true}
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

NewsReadonlyTextField.propTypes = {
  control: PropTypes.object.isRequired,
  name: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
};

/** Disabled date field for audit data (created on / closed on). */
function NewsReadonlyDateField({ control, name, label }) {
  const { t } = useTranslation();
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className="flex flex-col flex-auto">
          <FormLabel htmlFor={name}>{t(label)}</FormLabel>
          <FormControl>
            <Input
              id={name}
              name={name}
              disabled
              type="date"
              {...field}
              value={field.value}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

NewsReadonlyDateField.propTypes = {
  control: PropTypes.object.isRequired,
  name: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
};

/** Description textarea; locked once the news is closed. */
function NewsDescriptionField({ control, isClosed }) {
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
              id="description"
              placeholder={t('description_placeholder')}
              className="resize-none"
              maxLength={FIELD_LIMITS.news.description}
              disabled={isClosed}
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

NewsDescriptionField.propTypes = {
  control: PropTypes.object.isRequired,
  isClosed: PropTypes.bool.isRequired,
};

/** Dialog header: icon, action title and edit/add description. */
function buildDialogHeader({ t, actionDialog, newId }) {
  return (
    <DialogHeader>
      <DialogTitle>
        <LuNewspaper className="inline mr-3 w-7 h-7" />
        {actionDialog}
      </DialogTitle>
      <DialogDescription>
        {newId ? t('edit_message') : t('add_message')}
      </DialogDescription>
    </DialogHeader>
  );
}

/** Grid of form fields plus the dialog footer. */
function buildNewsFormFields({
  formDialog,
  datastatus,
  newId,
  isClosed,
  onDeleteById,
  t,
}) {
  return (
    <>
      <div className="grid grid-cols-2 gap-6 py-4 auto-rows-auto">
        <NewsDocumentField control={formDialog.control} isClosed={isClosed} />
        <NewsStatusField
          control={formDialog.control}
          datastatus={datastatus}
          newId={newId}
          isClosed={isClosed}
        />

        {/* created by / on (edit only) */}
        {newId && (
          <NewsReadonlyTextField
            control={formDialog.control}
            name="userNewsCreated"
            label="created_by"
          />
        )}
        {newId && (
          <NewsReadonlyDateField
            control={formDialog.control}
            name="createdOn"
            label="created_on"
          />
        )}

        {/* closed by / on (only when closed) */}
        {isClosed && (
          <NewsReadonlyTextField
            control={formDialog.control}
            name="userNewsClosed"
            label="closed_by"
          />
        )}
        {isClosed && (
          <NewsReadonlyDateField
            control={formDialog.control}
            name="closedOn"
            label="closed_on"
          />
        )}

        <NewsDescriptionField
          control={formDialog.control}
          isClosed={isClosed}
        />
      </div>

      {buildDialogFooter({
        t,
        newId,
        statusCodeSaved: isClosed ? NewsStatusCode.CLOSED : null,
        onDeleteById,
      })}
    </>
  );
}

/** Dialog footer: close, delete (edit only) and save (unless closed). */
function buildDialogFooter({ t, newId, statusCodeSaved, onDeleteById }) {
  return (
    <DialogFooter>
      <DialogClose asChild>
        <Button type="button" variant="secondary">
          {t('close')}
        </Button>
      </DialogClose>
      {newId && (
        <Button
          type="button"
          variant="destructive"
          onClick={() => onDeleteById(newId)}
        >
          {t('delete')}
        </Button>
      )}

      {statusCodeSaved !== NewsStatusCode.CLOSED && (
        <Button type="submit" variant="info">
          {t('save')}
        </Button>
      )}
    </DialogFooter>
  );
}

/**
 * Dialog form state: reset on row/open change, dirty-field submit payload.
 */
function useNewsDialogForm({ openDialog, selectedRow, onCreateUpdate }) {
  // Configura el formulario
  const formDialog = useForm({
    resolver: zodResolver(NewsDialogSchema),
  });
  const {
    formState: { dirtyFields },
  } = formDialog;

  const newId = useMemo(() => selectedRow?.id ?? null, [selectedRow?.id]);
  const statusCodeSaved = useMemo(
    () => selectedRow?.status.code ?? null,
    [selectedRow?.status]
  );

  // Actualiza todos los valores del formulario al cambiar `selectedRow`
  useEffect(() => {
    if (selectedRow?.id) {
      // Filtra y mapea solo los valores necesarios
      const mappedValues = mapSelectedRowToFormValues(selectedRow);
      formDialog.reset(mappedValues);
    }

    if (!openDialog) {
      formDialog.reset();
    }
  }, [selectedRow, openDialog, formDialog]);

  const onSubmitDialog = (data) => {
    // keep same data transformations
    if (newId) {
      const changes = pickDirty(data, dirtyFields);
      onCreateUpdate({ id: newId, body: changes });
    } else {
      onCreateUpdate(data);
    }
  };

  return { formDialog, newId, statusCodeSaved, onSubmitDialog };
}

export const NewsDialog = ({
  openDialog,
  setSelectedRow,
  selectedRow,
  setOpenDialog,
  actionDialog,
  datastatus,
  onCreateUpdate,
  onDeleteById,
}) => {
  const { t } = useTranslation();
  const { formDialog, newId, statusCodeSaved, onSubmitDialog } =
    useNewsDialogForm({ openDialog, selectedRow, onCreateUpdate });

  const isClosed = newId && statusCodeSaved === NewsStatusCode.CLOSED;

  return (
    <Dialog
      open={openDialog}
      onOpenChange={(isOpen) => {
        if (isOpen === true) return;
        setSelectedRow({});
        setOpenDialog(false);
      }}
    >
      <DialogContent>
        {buildDialogHeader({ t, actionDialog, newId })}

        <Form {...formDialog}>
          <form
            method="post"
            action=""
            id="news-form"
            noValidate
            onSubmit={formDialog.handleSubmit(onSubmitDialog)}
          >
            {buildNewsFormFields({
              formDialog,
              datastatus,
              newId,
              isClosed,
              onDeleteById,
              t,
            })}
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

NewsDialog.propTypes = {
  openDialog: PropTypes.bool.isRequired,
  setSelectedRow: PropTypes.func,
  selectedRow: PropTypes.object,
  setOpenDialog: PropTypes.func,
  actionDialog: PropTypes.string,
  datastatus: PropTypes.object,
  onCreateUpdate: PropTypes.func,
  onDeleteById: PropTypes.func,
};

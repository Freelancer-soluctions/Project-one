import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon } from '@radix-ui/react-icons';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { LuUsersRound } from 'react-icons/lu';
import PropTypes from 'prop-types';
import { UserSchema } from '../utils';
import { FIELD_LIMITS } from '@/config/fieldLimits';

/** Text input field (parametrized name/label/placeholder/type). */
function UserTextField({
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
              maxLength={FIELD_LIMITS.users[name]}
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

UserTextField.propTypes = {
  control: PropTypes.object.isRequired,
  name: PropTypes.string.isRequired,
  labelKey: PropTypes.string.isRequired,
  placeholderKey: PropTypes.string.isRequired,
  type: PropTypes.string,
  required: PropTypes.bool,
};

/** Date picker field (dates before 1900 disabled). */
function UserDateField({ control, name, labelKey, required = false }) {
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
          <Popover>
            <PopoverTrigger asChild>
              <FormControl>
                <Button
                  id={name}
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

UserDateField.propTypes = {
  control: PropTypes.object.isRequired,
  name: PropTypes.string.isRequired,
  labelKey: PropTypes.string.isRequired,
  required: PropTypes.bool,
};

/** Admin checkbox field. */
function UserAdminCheckboxField({ control }) {
  const { t } = useTranslation();
  return (
    <FormField
      control={control}
      name="isAdmin"
      render={({ field }) => (
        <FormItem className="flex items-center space-x-2">
          <FormLabel htmlFor="isAdmin">{t('is_admin')}</FormLabel>
          <FormControl>
            <Input
              type="checkbox"
              id="isAdmin"
              checked={field.value}
              {...field}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

UserAdminCheckboxField.propTypes = {
  control: PropTypes.object.isRequired,
};

/** Renders a list of text-field definitions in order. */
const renderTextFields = (form, defs) =>
  defs.map((def) => (
    <UserTextField key={def.name} control={form.control} {...def} />
  ));

/** Text fields before the date pickers. */
const TOP_TEXT_FIELDS = [
  {
    name: 'name',
    labelKey: 'name',
    placeholderKey: 'user_name_placeholder',
    required: true,
  },
  {
    name: 'email',
    labelKey: 'email',
    placeholderKey: 'user_email_placeholder',
    type: 'email',
    required: true,
  },
  {
    name: 'telephone',
    labelKey: 'telephone',
    placeholderKey: 'user_telephone_placeholder',
    type: 'tel',
    required: true,
  },
  {
    name: 'address',
    labelKey: 'address',
    placeholderKey: 'user_address_placeholder',
  },
];

/** Text fields after the admin checkbox. */
const BOTTOM_TEXT_FIELDS = [
  {
    name: 'picture',
    labelKey: 'picture',
    placeholderKey: 'user_picture_placeholder',
    type: 'document',
  },
  {
    name: 'document',
    labelKey: 'document',
    placeholderKey: 'user_document_placeholder',
    type: 'document',
  },
  {
    name: 'roleId',
    labelKey: 'role_id',
    placeholderKey: 'user_role_id_placeholder',
    type: 'number',
    required: true,
  },
  {
    name: 'statusId',
    labelKey: 'status_id',
    placeholderKey: 'user_status_id_placeholder',
    type: 'number',
    required: true,
  },
  {
    name: 'userPermitId',
    labelKey: 'user_permit_id',
    placeholderKey: 'user_permit_id_placeholder',
    type: 'number',
    required: true,
  },
];

/** Text fields between the date pickers and the admin checkbox. */
const MID_TEXT_FIELDS = [
  {
    name: 'socialSecurity',
    labelKey: 'social_security',
    placeholderKey: 'user_social_security_placeholder',
    required: true,
  },
  {
    name: 'zipcode',
    labelKey: 'zipcode',
    placeholderKey: 'user_zipcode_placeholder',
    required: true,
  },
  {
    name: 'state',
    labelKey: 'state',
    placeholderKey: 'user_state_placeholder',
  },
  {
    name: 'city',
    labelKey: 'city',
    placeholderKey: 'user_city_placeholder',
  },
];

/** Grid of dialog form fields in display order. */
function buildUserFields({ form }) {
  return (
    <div className="grid grid-cols-2 gap-6 py-4 auto-rows-auto">
      {renderTextFields(form, TOP_TEXT_FIELDS)}

      <UserDateField
        control={form.control}
        name="birthday"
        labelKey="birthday"
        required
      />
      <UserDateField
        control={form.control}
        name="startDate"
        labelKey="start_date"
        required
      />

      {renderTextFields(form, MID_TEXT_FIELDS)}

      <UserAdminCheckboxField control={form.control} />

      {renderTextFields(form, BOTTOM_TEXT_FIELDS)}
    </div>
  );
}

/** Dialog header: users icon, action title and edit description. */
function buildDialogHeader({ t, actionDialog }) {
  return (
    <DialogHeader>
      <DialogTitle className="flex items-center gap-2">
        <LuUsersRound className="inline mr-3 w-7 h-7" />
        {actionDialog}
      </DialogTitle>
      <DialogDescription>{t('edit_message')}</DialogDescription>
    </DialogHeader>
  );
}

/** Dialog footer: cancel, delete (edit only) and save/update. */
function buildDialogFooter({ t, userId, handleDelete }) {
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

      {userId && (
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
        {userId ? t('update') : t('save')}
      </Button>
    </DialogFooter>
  );
}

/**
 * Dialog form state: reset from the selected row, submit passes the
 * user id alongside the values.
 */
function useUserDialogForm({
  openDialog,
  selectedRow,
  onSubmit,
  onDeleteById,
}) {
  const form = useForm({
    resolver: zodResolver(UserSchema),
  });

  const userId = useMemo(() => selectedRow?.id ?? null, [selectedRow?.id]);

  // Actualiza todos los valores del formulario al cambiar `selectedRow`
  useEffect(() => {
    if (selectedRow?.id) {
      // Filtra y mapea solo los valores necesarios
      form.reset({
        name: selectedRow.name,
        email: selectedRow.email,
        telephone: selectedRow.telephone,
        address: selectedRow.address,
        birthday: selectedRow.birthday,
        startDate: selectedRow.startDate,
        socialSecurity: selectedRow.socialSecurity,
        zipcode: selectedRow.zipcode,
        state: selectedRow.state,
        city: selectedRow.city,
        isAdmin: selectedRow.isAdmin,
        picture: selectedRow.picture,
        document: selectedRow.document,
        roleId: selectedRow.roleId,
        statusId: selectedRow.statusId,
      });
    }

    if (!openDialog) {
      form.reset({
        name: '',
        email: '',
        telephone: '',
        address: '',
        birthday: '',
        startDate: '',
        socialSecurity: '',
        zipcode: '',
        state: '',
        city: '',
        isAdmin: false,
        picture: '',
        document: '',
        roleId: '',
        statusId: '',
      });
    }
  }, [selectedRow, openDialog, form]);

  const handleSubmit = (data) => {
    onSubmit(data, userId);
  };

  const handleDelete = () => {
    onDeleteById(selectedRow.id);
  };

  return { form, userId, handleSubmit, handleDelete };
}

export const UsersDialog = ({
  openDialog,
  onCloseDialog,
  selectedRow,
  onSubmit,
  onDeleteById,
  actionDialog,
}) => {
  const { t } = useTranslation();
  const { form, userId, handleSubmit, handleDelete } = useUserDialogForm({
    openDialog,
    selectedRow,
    onSubmit,
    onDeleteById,
  });

  return (
    <Dialog open={openDialog} onOpenChange={onCloseDialog}>
      <DialogContent className="sm:max-w-[600px]">
        {buildDialogHeader({ t, actionDialog })}
        <Form {...form}>
          <form
            method="post"
            action=""
            id="user-form"
            noValidate
            onSubmit={form.handleSubmit(handleSubmit)}
            className="flex flex-col flex-wrap gap-5"
          >
            {buildUserFields({ form })}

            {buildDialogFooter({ t, userId, handleDelete })}
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

UsersDialog.propTypes = {
  openDialog: PropTypes.bool.isRequired,
  onCloseDialog: PropTypes.func.isRequired,
  selectedRow: PropTypes.object,
  onSubmit: PropTypes.func.isRequired,
  onDeleteById: PropTypes.func.isRequired,
  actionDialog: PropTypes.string.isRequired,
};

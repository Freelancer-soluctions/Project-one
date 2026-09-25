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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { UserSchema } from '../utils';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useEffect, useMemo } from 'react';
import { pickDirty } from '@/utils/pickDirty';
import { cn } from '@/lib/utils';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { LuUser } from 'react-icons/lu';
import { LucideUserCheck } from 'lucide-react';
import PropTypes from 'prop-types';
import { FIELD_LIMITS } from '@/config/fieldLimits';

/** Maps the selected row + permits catalog to nested form values. */
const mapRowToFormValues = (selectedRow, dataPermits) => ({
  user: {
    ...selectedRow,
    birthday: selectedRow.birthday
      ? new Date(selectedRow.birthday).toISOString().split('T')[0]
      : '',
    startDate: selectedRow.startDate
      ? new Date(selectedRow.startDate).toISOString().split('T')[0]
      : '',
    lastUpdatedOn: selectedRow.lastUpdatedOn
      ? new Date(selectedRow.lastUpdatedOn).toISOString().split('T')[0]
      : '',
    status: {
      id: selectedRow.statusId,
      code: selectedRow.statusCode,
      description: selectedRow.statusDescription,
    },
    roles: {
      id: selectedRow.roleId,
      code: selectedRow.roleCode,
      description: selectedRow.roleDescription,
    },
  },

  permissions: dataPermits.map((p) => ({
    id: p.id,
    code: p.code,
    description: p.description,
    assigned: p.assigned ?? false,
  })),
});

/** Text input field for `user.<leaf>` paths (parametrized). */
function UserTextField({
  control,
  name,
  labelKey,
  placeholderKey,
  type = 'text',
  required = false,
}) {
  const { t } = useTranslation();
  const id = name.split('.').pop();
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel htmlFor={id}>
            {t(labelKey)}
            {required ? '*' : ''}
          </FormLabel>
          <FormControl>
            <Input
              id={id}
              name={id}
              placeholder={t(placeholderKey)}
              type={type}
              autoComplete="off"
              maxLength={FIELD_LIMITS.users[id]}
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

/** Disabled date input field (readonly audit/basic dates). */
function UserDateInputField({ control, name, labelKey }) {
  const { t } = useTranslation();
  const id = name.split('.').pop();
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className="flex flex-col flex-auto">
          <FormLabel htmlFor={id}>{t(labelKey)}</FormLabel>
          <FormControl>
            <Input
              id={id}
              name={id}
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

UserDateInputField.propTypes = {
  control: PropTypes.object.isRequired,
  name: PropTypes.string.isRequired,
  labelKey: PropTypes.string.isRequired,
};

/** Disabled read-only text field (updated by). */
function UserReadonlyTextField({ control, name, labelKey }) {
  const { t } = useTranslation();
  const id = name.split('.').pop();
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className="flex flex-col flex-auto col-span-1">
          <FormLabel htmlFor={id}>{t(labelKey)}</FormLabel>
          <FormControl>
            <Input
              id={id}
              name={id}
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

UserReadonlyTextField.propTypes = {
  control: PropTypes.object.isRequired,
  name: PropTypes.string.isRequired,
  labelKey: PropTypes.string.isRequired,
};

/**
 * Catalog select field: stores the full selected object, keyed by
 * `code` (roles/status).
 */
function UserCatalogSelectField({
  control,
  name,
  labelKey,
  placeholderKey,
  dataCatalog,
}) {
  const { t } = useTranslation();
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel htmlFor={labelKey}>{t(labelKey)}*</FormLabel>
          <Select
            onValueChange={(code) => {
              // Buscar el objeto completo por el `code`
              if (dataCatalog.length > 0) {
                const selected = dataCatalog.find((item) => item.code === code);
                if (selected) {
                  field.onChange(selected); // Asignar el objeto completo
                }
              }
            }}
            value={field.value?.code}
          >
            <FormControl>
              <SelectTrigger
                className={cn(
                  'w-full',
                  !field.value && 'text-muted-foreground'
                )}
              >
                <SelectValue
                  placeholder={t(placeholderKey)}
                  className="w-full"
                />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {dataCatalog.map((item, index) => (
                <SelectItem key={index} value={item.code}>
                  {item.description}
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

UserCatalogSelectField.propTypes = {
  control: PropTypes.object.isRequired,
  name: PropTypes.string.isRequired,
  labelKey: PropTypes.string.isRequired,
  placeholderKey: PropTypes.string.isRequired,
  dataCatalog: PropTypes.array.isRequired,
};

/** Admin checkbox field. */
function UserAdminCheckboxField({ control }) {
  const { t } = useTranslation();
  return (
    <FormField
      control={control}
      name="user.isAdmin"
      render={({ field }) => (
        <FormItem className="flex flex-row items-start p-4 space-x-3 space-y-0 border rounded-md">
          <FormControl>
            <Checkbox
              id="isAdmin"
              name="isAdmin"
              checked={field.value}
              onCheckedChange={field.onChange}
            />
          </FormControl>
          <div className="space-y-1 leading-none">
            <FormLabel htmlFor="isAdmin">{t('is_admin')}</FormLabel>
          </div>
        </FormItem>
      )}
    />
  );
}

UserAdminCheckboxField.propTypes = {
  control: PropTypes.object.isRequired,
};

/** Assigned-permit checkbox for `permissions.<index>.assigned`. */
function UserPermitCheckboxField({ control, name, label }) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className="flex items-center space-x-2">
          <FormControl>
            <Checkbox
              className="mt-2"
              id="permit.code"
              checked={field.value}
              // onCheckedChange={field.onChange}
              onCheckedChange={(checked) => field.onChange(checked)}
            />
          </FormControl>
          <FormLabel
            htmlFor="permit.code"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            {label}
          </FormLabel>
        </FormItem>
      )}
    />
  );
}

UserPermitCheckboxField.propTypes = {
  control: PropTypes.object.isRequired,
  name: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
};

/** Renders a list of text-field definitions in order. */
const renderTextFields = (form, defs) =>
  defs.map((def) => (
    <UserTextField key={def.name} control={form.control} {...def} />
  ));

/** Basic user text fields before the date inputs. */
const USER_INFO_TEXT_FIELDS = [
  {
    name: 'user.name',
    labelKey: 'name',
    placeholderKey: 'user_name_placeholder',
    required: true,
  },
  {
    name: 'user.email',
    labelKey: 'email',
    placeholderKey: 'user_email_placeholder',
    type: 'email',
    required: true,
  },
  {
    name: 'user.telephone',
    labelKey: 'telephone',
    placeholderKey: 'user_telephone_placeholder',
    type: 'tel',
    required: true,
  },
  {
    name: 'user.address',
    labelKey: 'address',
    placeholderKey: 'user_address_placeholder',
  },
];

/** Basic user text fields after the date inputs. */
const USER_INFO_MID_TEXT_FIELDS = [
  {
    name: 'user.socialSecurity',
    labelKey: 'social_security',
    placeholderKey: 'user_social_security_placeholder',
    required: true,
  },
  {
    name: 'user.zipcode',
    labelKey: 'zipcode',
    placeholderKey: 'user_zipcode_placeholder',
    required: true,
  },
  {
    name: 'user.state',
    labelKey: 'state',
    placeholderKey: 'user_state_placeholder',
    required: true,
  },
  {
    name: 'user.city',
    labelKey: 'city',
    placeholderKey: 'user_city_placeholder',
    required: true,
  },
  {
    name: 'user.picture',
    labelKey: 'picture',
    placeholderKey: 'user_picture_placeholder',
    type: 'document',
  },
  {
    name: 'user.document',
    labelKey: 'document',
    placeholderKey: 'user_document_placeholder',
    type: 'document',
  },
];

/** Grid of basic user info fields in display order. */
function buildUserInfoFields({ form, dataRol, dataStatus }) {
  return (
    <div className="grid grid-cols-2 gap-6 py-4 auto-rows-auto">
      {renderTextFields(form, USER_INFO_TEXT_FIELDS)}

      <UserDateInputField
        control={form.control}
        name="user.birthday"
        labelKey="birthday"
      />
      <UserDateInputField
        control={form.control}
        name="user.startDate"
        labelKey="start_date"
      />

      {renderTextFields(form, USER_INFO_MID_TEXT_FIELDS)}

      <UserCatalogSelectField
        control={form.control}
        name="user.roles"
        labelKey="rol"
        placeholderKey="select_role"
        dataCatalog={dataRol}
      />
      <UserCatalogSelectField
        control={form.control}
        name="user.status"
        labelKey="status"
        placeholderKey="select_status"
        dataCatalog={dataStatus}
      />

      <UserReadonlyTextField
        control={form.control}
        name="user.lastUpdatedByName"
        labelKey="updated_by"
      />
      <UserDateInputField
        control={form.control}
        name="user.lastUpdatedOn"
        labelKey="updated_on"
      />

      <UserAdminCheckboxField control={form.control} />
    </div>
  );
}

/** Grid of assigned-permit checkboxes. */
function buildPermitsFields({ form, permissions }) {
  return (
    <div className="grid grid-cols-3 gap-6 py-4 auto-rows-auto">
      {permissions?.map((permit, index) => (
        <UserPermitCheckboxField
          key={permit.id || index}
          control={form.control}
          name={`permissions.${index}.assigned`}
          label={permit.description}
        />
      ))}
    </div>
  );
}

/** Accordion item with the basic user information fields. */
function buildInfoAccordionItem({ t, form, dataRol, dataStatus }) {
  return (
    <AccordionItem
      value="info"
      className="mb-2 border rounded-md shadow-sm border-border bg-card"
    >
      <AccordionTrigger className="px-4 py-4 hover:bg-accent hover:no-underline rounded-t-md">
        <div className="flex items-center gap-2">
          <LuUser className="w-5 h-5" />
          <span className="font-medium">{t('user_information')}</span>
        </div>
      </AccordionTrigger>
      <AccordionContent className="pt-4 pb-2 px-4 max-h-[50vh] overflow-y-auto scrollbar-thin">
        {buildUserInfoFields({ form, dataRol, dataStatus })}
      </AccordionContent>
    </AccordionItem>
  );
}

/** Accordion item with the user permits checkboxes. */
function buildPermitsAccordionItem({ t, form, permissions }) {
  return (
    <AccordionItem
      value="permits"
      className="mb-2 border rounded-md shadow-sm border-border bg-card"
    >
      <AccordionTrigger className="px-4 py-4 hover:bg-accent hover:no-underline rounded-t-md">
        <div className="flex items-center gap-2">
          <LucideUserCheck className="w-5 h-5" />
          <span className="font-medium">{t('user_permits')}</span>
        </div>
      </AccordionTrigger>
      <AccordionContent className="pt-4 pb-2 px-4 max-h-[50vh] overflow-y-auto scrollbar-thin">
        {buildPermitsFields({ form, permissions })}
      </AccordionContent>
    </AccordionItem>
  );
}

/** Form action buttons: cancel (back to list), delete (edit only), edit. */
function buildFormButtons({ t, id, handleDelete, handleCancel }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 mt-5 md:justify-normal">
      <Button type="button" variant="secondary" onClick={handleCancel}>
        {t('cancel')}
      </Button>
      {id && (
        <Button
          type="button"
          variant="destructive"
          onClick={() => {
            handleDelete(id);
          }}
        >
          {t('delete')}
        </Button>
      )}
      <Button type="submit" variant="info">
        {t('edit')}
      </Button>
    </div>
  );
}

/**
 * Form state: nested reset from the selected row + permits, dirty-field
 * PATCH payload flattening on edit.
 */
function useUsersBasicInfoForm({ selectedRow, dataPermits, onSubmit }) {
  const form = useForm({
    resolver: zodResolver(UserSchema),
  });
  const {
    formState: { dirtyFields },
  } = form;

  const permissions = useWatch({
    control: form.control,
    name: 'permissions',
  });

  const id = useMemo(() => selectedRow?.id ?? null, [selectedRow?.id]);

  // Actualiza todos los valores del formulario al cambiar `selectedRow`
  useEffect(() => {
    if (selectedRow?.id) {
      form.reset(mapRowToFormValues(selectedRow, dataPermits));
    } else {
      form.reset();
    }
  }, [selectedRow, form, dataPermits]);

  const submitForm = (data) => {
    const selectedPermissions = data.permissions
      .filter((item) => item.assigned === true)
      .map((item) => item.id);

    if (id) {
      const rawChanges = pickDirty(data, dirtyFields);
      const result = {};
      if (rawChanges.user) Object.assign(result, rawChanges.user);
      if (rawChanges.permissions) {
        result.selectedPermissions = rawChanges.permissions
          .filter((item) => item?.assigned === true)
          .map((item) => item.id);
      }
      onSubmit(result);
    } else {
      onSubmit({ ...data.user, selectedPermissions });
    }
  };

  return { form, id, permissions, submitForm };
}

export const UsersBasicInfo = ({
  onSubmit,
  onDelete,
  dataStatus,
  dataPermits,
  dataRol,
  selectedRow,
}) => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const { form, id, permissions, submitForm } = useUsersBasicInfoForm({
    selectedRow,
    dataPermits,
    onSubmit,
  });

  const handleDelete = (id) => {
    onDelete(id);
  };

  const handleCancel = () => {
    navigate('/home/users', { replace: true });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('user_information')}</CardTitle>
        <CardDescription>{t('user_basic_information_msg')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Form {...form}>
          <form
            method="post"
            action=""
            id="user-form"
            noValidate
            onSubmit={form.handleSubmit(submitForm)}
            className="flex flex-col flex-wrap gap-5"
          >
            <Accordion type="single" collapsible className="w-full">
              {buildInfoAccordionItem({ t, form, dataRol, dataStatus })}
              {buildPermitsAccordionItem({ t, form, permissions })}
            </Accordion>
            {buildFormButtons({ t, id, handleDelete, handleCancel })}
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

UsersBasicInfo.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  dataStatus: PropTypes.array.isRequired,
  dataPermits: PropTypes.array.isRequired,
  dataRol: PropTypes.array.isRequired,
  selectedRow: PropTypes.object,
};

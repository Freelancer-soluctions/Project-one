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
import { EmployeeSchema } from '../utils';

export const EmployeesDialog = ({
  openDialog,
  onCloseDialog,
  selectedRow,
  onSubmit,
  onDeleteById,
  actionDialog,
}) => {
  const { t } = useTranslation();
  const employeeId = useMemo(()=> selectedRow?.id, [selectedRow?.id])

  const form = useForm({
    resolver: zodResolver(EmployeeSchema),
    defaultValues: {
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
    },
  });

  // Actualiza todos los valores del formulario al cambiar `selectedRow`
  useEffect(() => {
    if (selectedRow?.id) {
      // Filtra y mapea solo los valores necesarios
      const mappedValues = {
        id: selectedRow.id,
        name: selectedRow.name,
        lastName: selectedRow.lastName,
        dni: selectedRow.dni,
        email: selectedRow.email,
        phone: selectedRow.phone || '',
        address: selectedRow.address || '',
        startDate: selectedRow.startDate
          ? new Date(selectedRow.startDate)
          : new Date(),
        position: selectedRow.position,
        department: selectedRow.department,
        salary: selectedRow.salary.toString(),
        createdOn: selectedRow.createdOn,
        updatedOn: selectedRow.updatedOn,
        userEmployeeCreatedName: selectedRow.userEmployeeCreatedName || '',
        userEmployeeUpdatedName: selectedRow.userEmployeeUpdatedName || '',
      };

      form.reset(mappedValues);
    }

    if (!openDialog) {
      form.reset({
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
    }
  }, [selectedRow, openDialog, form]);

  const handleSubmit = (data) => {
    onSubmit(data, employeeId);
  };

  const handleDelete = () => {
    onDeleteById(selectedRow.id);
  };

  return (
    <Dialog open={openDialog} onOpenChange={onCloseDialog}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LuUsersRound className="inline mr-3 w-7 h-7" />
            {actionDialog}
          </DialogTitle>
          <DialogDescription>
            {employeeId ? t('edit_message') : t('add_message')}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            method="post"
            action=""
            id="employee-form"
            noValidate
            onSubmit={form.handleSubmit(handleSubmit)}
            className="flex flex-col flex-wrap gap-5"
          >
            <div className="grid grid-cols-2 gap-6 py-4 auto-rows-auto">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => {
                  return (
                    <FormItem>
                      <FormLabel htmlFor="name">{t('name')}*</FormLabel>
                      <FormControl>
                        <Input
                          id="name"
                          name="name"
                          placeholder={t('employee_name_placeholder')}
                          type="text"
                          autoComplete="off"
                          maxLength={100}
                          {...field}
                          value={field.value ?? ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />

              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => {
                  return (
                    <FormItem>
                      <FormLabel htmlFor="lastName">
                        {t('last_name')}*
                      </FormLabel>
                      <FormControl>
                        <Input
                          id="lastName"
                          name="lastName"
                          placeholder={t('last_name_placeholder')}
                          type="text"
                          autoComplete="off"
                          maxLength={100}
                          {...field}
                          value={field.value ?? ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />

              <FormField
                control={form.control}
                name="dni"
                render={({ field }) => {
                  return (
                    <FormItem>
                      <FormLabel htmlFor="dni">{t('dni')}*</FormLabel>
                      <FormControl>
                        <Input
                          id="dni"
                          name="dni"
                          placeholder={t('dni_placeholder')}
                          type="text"
                          autoComplete="off"
                          maxLength={10}
                          {...field}
                          value={field.value ?? ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => {
                  return (
                    <FormItem>
                      <FormLabel htmlFor="email">{t('email')}*</FormLabel>
                      <FormControl>
                        <Input
                          id="email"
                          name="email"
                          placeholder={t('employee_email_placeholder')}
                          type="email"
                          autoComplete="off"
                          maxLength={100}
                          {...field}
                          value={field.value ?? ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => {
                  return (
                    <FormItem>
                      <FormLabel htmlFor="phone">{t('phone')}</FormLabel>
                      <FormControl>
                        <Input
                          id="phone"
                          name="phone"
                          placeholder={t('employee_phone_placeholder')}
                          type="tel"
                          autoComplete="off"
                          maxLength={15}
                          {...field}
                          value={field.value ?? ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => {
                  return (
                    <FormItem>
                      <FormLabel htmlFor="address">{t('address')}</FormLabel>
                      <FormControl>
                        <Input
                          id="address"
                          name="address"
                          placeholder={t('employee_address_placeholder')}
                          type="text"
                          autoComplete="off"
                          maxLength={120}
                          {...field}
                          value={field.value ?? ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />

              <FormField
                control={form.control}
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

              <FormField
                control={form.control}
                name="position"
                render={({ field }) => {
                  return (
                    <FormItem>
                      <FormLabel htmlFor="position">{t('position')}*</FormLabel>
                      <FormControl>
                        <Input
                          id="position"
                          name="position"
                          placeholder={t('employee_position_placeholder')}
                          type="text"
                          autoComplete="off"
                          maxLength={100}
                          {...field}
                          value={field.value ?? ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />

              <FormField
                control={form.control}
                name="department"
                render={({ field }) => {
                  return (
                    <FormItem>
                      <FormLabel htmlFor="department">
                        {t('department')}*
                      </FormLabel>
                      <FormControl>
                        <Input
                          id="department"
                          name="department"
                          placeholder={t('employee_department_placeholder')}
                          type="text"
                          autoComplete="off"
                          maxLength={100}
                          {...field}
                          value={field.value ?? ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />

              <FormField
                control={form.control}
                name="salary"
                render={({ field }) => {
                  return (
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
                  );
                }}
              />

              {selectedRow?.createdOn && employeeId && (
                <>
                  <FormField
                    control={form.control}
                    name="userEmployeeCreatedName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel htmlFor="userEmployeeCreatedName">
                          {t('created_by')}
                        </FormLabel>
                        <FormControl>
                          <Input
                            id="userEmployeeCreatedName"
                            name="userEmployeeCreatedName"
                            disabled
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="createdOn"
                    render={({ field }) => (
                      <FormItem className="flex flex-col flex-auto">
                        <FormLabel htmlFor="createdOn">
                          {t('created_on')}
                        </FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                id="createdOn"
                                disabled={true}
                                readOnly={true}
                                variant={'outline'}
                                className={cn(
                                  'pl-3 text-left font-normal',
                                  !field.value && 'text-muted-foreground'
                                )}
                              >
                                {field.value &&
                                  format(new Date(field.value), 'PPP')}
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
                </>
              )}
              {selectedRow?.updatedOn && employeeId && (
                <>
                  <FormField
                    control={form.control}
                    name="userEmployeeUpdatedName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel htmlFor="userEmployeeUpdatedName">
                          {t('updated_by')}
                        </FormLabel>
                        <FormControl>
                          <Input
                            id="userEmployeeUpdatedName"
                            name="userEmployeeUpdatedName"
                            disabled
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="updatedOn"
                    render={({ field }) => (
                      <FormItem className="flex flex-col flex-auto">
                        <FormLabel htmlFor="updatedOn">
                          {t('updated_on')}
                        </FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                id="updatedOn"
                                disabled={true}
                                readOnly={true}
                                variant={'outline'}
                                className={cn(
                                  'pl-3 text-left font-normal',
                                  !field.value && 'text-muted-foreground'
                                )}
                              >
                                {field.value &&
                                  format(new Date(field.value), 'PPP')}
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
                </>
              )}
            </div>
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
                  onClick={() => {
                    handleDelete();
                  }}
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

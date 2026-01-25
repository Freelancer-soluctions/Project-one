import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import PropTypes from 'prop-types';

import { VacationSchema, VACATION_STATUS } from '../utils'; // Import schema

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
import { Input } from '@/components/ui/input'; // Keep Input for CreatedBy/UpdatedBy
import { Button } from '@/components/ui/button';
import { CalendarIcon } from '@radix-ui/react-icons'; // Using BackpackIcon
import { LuBackpack } from 'react-icons/lu';

export const VacationDialog = ({
  openDialog,
  onCloseDialog,
  selectedRow,
  onSubmit,
  onDeleteById,
  actionDialog,
  dataEmployees,
}) => {
  const { t } = useTranslation();

  const form = useForm({
    resolver: zodResolver(VacationSchema),
    defaultValues: {
      employeeId: '',
      startDate: null,
      endDate: null,
      status: 'PENDING',
    },
  });

  const vacationId = useMemo(()=> selectedRow?.id ?? null, [selectedRow?.id])

  useEffect(() => {
    if (selectedRow?.id) {
      const mappedValues = {
        id: selectedRow.id,
        employeeId: selectedRow.employeeId,
        startDate: selectedRow.startDate
          ? new Date(selectedRow.startDate)
          : null,
        endDate: selectedRow.endDate ? new Date(selectedRow.endDate) : null,
        status: selectedRow.status ?? 'PENDING',
        createdOn: selectedRow.createdOn,
        updatedOn: selectedRow.updatedOn,
        userVacationCreatedName: selectedRow.userVacationCreatedName,
        userVacationUpdatedName: selectedRow.userVacationUpdatedName,
      };
      form.reset(mappedValues);
    } else {
      form.reset({
        employeeId: '',
        startDate: null,
        endDate: null,
        status: 'PENDING',
      });
    }
  }, [selectedRow, openDialog, form]);

  const handleSubmit = (data) => {
    const submissionData = {
      ...data,
      startDate: data.startDate ? format(data.startDate, 'yyyy-MM-dd') : null,
      endDate: data.endDate ? format(data.endDate, 'yyyy-MM-dd') : null,
    };
    onSubmit(submissionData, vacationId);
  };

  const handleDelete = () => {
    if (selectedRow?.id) {
      onDeleteById(selectedRow.id);
    }
  };

  return (
    <Dialog open={openDialog} onOpenChange={onCloseDialog}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LuBackpack className="inline mr-3 w-7 h-7" /> {/* Changed Icon */}
            {actionDialog}
          </DialogTitle>
          <DialogDescription>
            {vacationId
              ? t('edit_vacation_message')
              : t('add_vacation_message')}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            method="post"
            action=""
            id="vacation-form"
            noValidate
            onSubmit={form.handleSubmit(handleSubmit)}
            className="flex flex-col flex-wrap gap-5"
          >
            <div className="grid grid-cols-2 gap-6 py-4 auto-rows-auto">
              {/* Employee Select */}
              <FormField
                control={form.control}
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
                          <SelectValue
                            placeholder={t('select_employee_placeholder')}
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {dataEmployees.map((employee) => (
                          <SelectItem
                            key={employee.id}
                            value={employee.id.toString()}
                          >
                            {`${employee.name} ${employee.lastName}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Status Select */}
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('status')}*</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value ?? 'PENDING'}
                      // Consider disabling if not admin/manager
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={t('select_status_placeholder')}
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {VACATION_STATUS.map((status) => (
                          <SelectItem key={status} value={status}>
                            {t(`status.${status}`)}{' '}
                            {/* Assumes translations like status.PENDING */}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Start Date Picker */}
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
                          // Optionally disable past dates
                          // disabled={(date) => date < new Date() }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* End Date Picker */}
              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>{t('end_date')}*</FormLabel>
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
                          // Disable dates before the selected start date
                          disabled={(date) =>
                            form.getValues('startDate') &&
                            date < form.getValues('startDate')
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Created By/On Fields */}
              {selectedRow?.createdOn && vacationId && (
                <>
                  <FormField
                    control={form.control}
                    name="userVacationCreatedName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel htmlFor="userVacationCreatedName">
                          {t('created_by')}
                        </FormLabel>
                        <FormControl>
                          <Input
                            id="userVacationCreatedName"
                            name="userVacationCreatedName"
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
                              selected={
                                field.value ? new Date(field.value) : null
                              }
                              disabled={true}
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              {/* Updated By/On Fields */}
              {selectedRow?.updatedOn && vacationId && (
                <>
                  <FormField
                    control={form.control}
                    name="userVacationUpdatedName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel htmlFor="userVacationUpdatedName">
                          {t('updated_by')}
                        </FormLabel>
                        <FormControl>
                          <Input
                            id="userVacationUpdatedName"
                            name="userVacationUpdatedName"
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
                              selected={
                                field.value ? new Date(field.value) : null
                              }
                              disabled={true}
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

              {vacationId && (
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
                {vacationId ? t('update') : t('save')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

VacationDialog.propTypes = {
  openDialog: PropTypes.bool.isRequired,
  onCloseDialog: PropTypes.func.isRequired,
  selectedRow: PropTypes.object,
  onSubmit: PropTypes.func.isRequired,
  onDeleteById: PropTypes.func.isRequired,
  actionDialog: PropTypes.string.isRequired,
  dataEmployees: PropTypes.array.isRequired,
};

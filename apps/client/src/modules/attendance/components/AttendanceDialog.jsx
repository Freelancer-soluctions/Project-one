import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import PropTypes from 'prop-types';

import { AttendanceSchema } from '../utils'; // Import attendance schema

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
import { Button } from '@/components/ui/button';
import { CalendarIcon, ClockIcon } from '@radix-ui/react-icons'; // Using ClockIcon for time fields

export const AttendanceDialog = ({
  openDialog,
  onCloseDialog,
  selectedRow,
  onSubmit,
  onDeleteById,
  actionDialog,
  dataEmployees,
}) => {
  const { t } = useTranslation();
  const [attendanceId, setAttendanceId] = useState('');

  const form = useForm({
    resolver: zodResolver(AttendanceSchema),
    defaultValues: {
      employeeId: '',
      date: null,
      entryTime: '',
      exitTime: '',
      workedHours: '',
    },
  });

  useEffect(() => {
    if (selectedRow?.id) {
      const mappedValues = {
        id: selectedRow.id,
        employeeId: selectedRow.employeeId,
        // Ensure date is a Date object for the Calendar component
        date: selectedRow.date ? new Date(selectedRow.date) : null,
        entryTime: selectedRow.entryTime,
        exitTime: selectedRow.exitTime,
        workedHours: selectedRow.workedHours,
        createdOn: selectedRow.createdOn,
        updatedOn: selectedRow.updatedOn,
        userAttendanceCreatedName: selectedRow.userAttendanceCreatedName,
        userAttendanceUpdatedName: selectedRow.userAttendanceUpdatedName,
      };
      form.reset(mappedValues);
      setAttendanceId(mappedValues.id);
    } else {
      form.reset({
        employeeId: '',
        date: undefined,
        entryTime: '',
        exitTime: '',
        workedHours: '',
      });
      setAttendanceId(null);
    }
  }, [selectedRow, openDialog, form]);

  const handleSubmit = (data) => {
    // Format date back to ISO string if needed by the backend
    const submissionData = {
      ...data,
      date: data.date ? format(data.date, 'yyyy-MM-dd') : null,
      // Convert workedHours back to number if needed
      // workedHours: Number(data.workedHours)
    };
    onSubmit(submissionData, attendanceId);
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
            <ClockIcon className="inline mr-3 w-7 h-7" />
            {actionDialog}
          </DialogTitle>
          <DialogDescription>
            {attendanceId ? t('edit_message') : t('add_message')}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            method="post"
            action=""
            id="attendance-form"
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

              {/* Date Picker */}
              <FormField
                control={form.control}
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

              {/* Entry Time */}
              <FormField
                control={form.control}
                name="entryTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="entryTime">
                      {t('entry_time')}*
                    </FormLabel>
                    <FormControl>
                      <Input
                        id="entryTime"
                        name="entryTime"
                        placeholder="HH:mm"
                        type="time"
                        {...field}
                        value={field.value ?? ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Exit Time */}
              <FormField
                control={form.control}
                name="exitTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="exitTime">{t('exit_time')}*</FormLabel>
                    <FormControl>
                      <Input
                        id="exitTime"
                        name="exitTime"
                        placeholder="HH:mm"
                        type="time"
                        {...field}
                        value={field.value ?? ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Worked Hours */}
              <FormField
                control={form.control}
                name="workedHours"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="workedHours">
                      {t('worked_hours')}*
                    </FormLabel>
                    <FormControl>
                      <Input
                        id="workedHours"
                        name="workedHours"
                        placeholder={t('worked_hours_placeholder')}
                        type="number"
                        step="0.01" // Allow decimals
                        min="0"
                        {...field}
                        value={field.value ?? ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Created By/On Fields (similar to ClientsDialog) */}
              {selectedRow?.createdOn && attendanceId && (
                <>
                  <FormField
                    control={form.control}
                    name="userAttendanceCreatedName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel htmlFor="userAttendanceCreatedName">
                          {t('created_by')}
                        </FormLabel>
                        <FormControl>
                          <Input
                            id="userAttendanceCreatedName"
                            name="userAttendanceCreatedName"
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

              {/* Updated By/On Fields (similar to ClientsDialog) */}
              {selectedRow?.updatedOn && attendanceId && (
                <>
                  <FormField
                    control={form.control}
                    name="userAttendanceUpdatedName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel htmlFor="userAttendanceUpdatedName">
                          {t('updated_by')}
                        </FormLabel>
                        <FormControl>
                          <Input
                            id="userAttendanceUpdatedName"
                            name="userAttendanceUpdatedName"
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

              {attendanceId && (
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
                {attendanceId ? t('update') : t('save')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

AttendanceDialog.propTypes = {
  openDialog: PropTypes.bool.isRequired,
  onCloseDialog: PropTypes.func.isRequired,
  selectedRow: PropTypes.object,
  onSubmit: PropTypes.func.isRequired,
  onDeleteById: PropTypes.func.isRequired,
  actionDialog: PropTypes.string.isRequired,
  dataEmployees: PropTypes.array.isRequired,
};

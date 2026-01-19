import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import PropTypes from 'prop-types';

import {
  PermissionSchema,
  PERMISSION_TYPES,
  PERMISSION_STATUS,
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
import { CalendarIcon } from '@radix-ui/react-icons'; // Using ClipboardIcon
import { LuClipboard } from 'react-icons/lu';

export const PermissionDialog = ({
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
    resolver: zodResolver(PermissionSchema),
    defaultValues: {
      employeeId: '',
      type: undefined, // Use undefined for initial Select state
      startDate: null,
      endDate: null,
      reason: '',
      status: 'PENDING',
      comments: '',
    },
  });

  const permissionId = useMemo(() => selectedRow?.id ?? null,[selectedRow?.id] )

  useEffect(() => {
    if (selectedRow?.id) {
      const mappedValues = {
        id: selectedRow.id,
        employeeId: selectedRow.employeeId,
        type: selectedRow.type,
        startDate: selectedRow.startDate
          ? new Date(selectedRow.startDate)
          : null,
        endDate: selectedRow.endDate ? new Date(selectedRow.endDate) : null,
        reason: selectedRow.reason ?? '',
        status: selectedRow.status ?? 'PENDING',
        comments: selectedRow.comments ?? '',
        createdOn: selectedRow.createdOn,
        updatedOn: selectedRow.updatedOn,
        userPermissionCreatedName: selectedRow.userPermissionCreatedName,
        userPermissionUpdatedName: selectedRow.userPermissionUpdatedName,
        // approvedBy and approvedAt are likely handled by the backend
      };
      form.reset(mappedValues);
    } else {
      form.reset({
        employeeId: '',
        type: undefined,
        startDate: null,
        endDate: null,
        reason: '',
        status: 'PENDING',
        comments: '',
      });
    }
  }, [selectedRow, openDialog, form]);

  const handleSubmit = (data) => {
    const submissionData = {
      ...data,
      startDate: data.startDate ? format(data.startDate, 'yyyy-MM-dd') : null,
      endDate: data.endDate ? format(data.endDate, 'yyyy-MM-dd') : null,
    };
    onSubmit(submissionData, permissionId);
  };

  const handleDelete = () => {
    if (selectedRow?.id) {
      onDeleteById(selectedRow.id);
    }
  };

  return (
    <Dialog open={openDialog} onOpenChange={onCloseDialog}>
      {/* Increased max width for more fields */}
      <DialogContent className="sm:max-w-[750px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LuClipboard className="inline mr-3 w-7 h-7" /> {/* Changed Icon */}
            {actionDialog}
          </DialogTitle>
          <DialogDescription>
            {permissionId
              ? t('edit_permission_message')
              : t('add_permission_message')}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            method="post"
            action=""
            id="permission-form"
            noValidate
            onSubmit={form.handleSubmit(handleSubmit)}
            className="flex flex-col flex-wrap gap-5"
          >
            {/* Use grid-cols-3 for potentially more fields per row */}
            <div className="grid grid-cols-1 gap-6 py-4 md:grid-cols-3 auto-rows-auto">
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

              {/* Type Select */}
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('type')}*</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value ?? ''}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={t(
                              'select_permission_type_placeholder'
                            )}
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {PERMISSION_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {t(`permission_type.${type}`)}{' '}
                            {/* Assumes translations like permission_type.SICK */}
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
                      // Consider disabling based on user role
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={t('select_status_placeholder')}
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {PERMISSION_STATUS.map((status) => (
                          <SelectItem key={status} value={status}>
                            {t(`status.${status}`)}
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

              {/* Spacer - Can add another field like approvedBy if needed and handled by FE */}
              <div className="md:col-span-1"></div>

              {/* Reason Textarea */}
              <FormField
                control={form.control}
                name="reason"
                render={({ field }) => (
                  <FormItem className="md:col-span-3">
                    {' '}
                    {/* Span across grid */}
                    <FormLabel htmlFor="reason">{t('reason')}*</FormLabel>
                    <FormControl>
                      <Textarea
                        id="reason"
                        name="reason"
                        placeholder={t('permission_reason_placeholder')}
                        maxLength={500}
                        rows={3}
                        {...field}
                        value={field.value ?? ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Comments Textarea */}
              <FormField
                control={form.control}
                name="comments"
                render={({ field }) => (
                  <FormItem className="md:col-span-3">
                    {' '}
                    {/* Span across grid */}
                    <FormLabel htmlFor="comments">{t('comments')}</FormLabel>
                    <FormControl>
                      <Textarea
                        id="comments"
                        name="comments"
                        placeholder={t('permission_comments_placeholder')}
                        maxLength={1000}
                        rows={3}
                        {...field}
                        value={field.value ?? ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Created By/On Fields */}
              {selectedRow?.createdOn && permissionId && (
                <>
                  <FormField
                    control={form.control}
                    name="userPermissionCreatedName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel htmlFor="userPermissionCreatedName">
                          {t('created_by')}
                        </FormLabel>
                        <FormControl>
                          <Input
                            id="userPermissionCreatedName"
                            name="userPermissionCreatedName"
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
                  {/* Spacer */}
                  <div className="md:col-span-1"></div>
                </>
              )}

              {/* Updated By/On Fields */}
              {selectedRow?.updatedOn && permissionId && (
                <>
                  <FormField
                    control={form.control}
                    name="userPermissionUpdatedName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel htmlFor="userPermissionUpdatedName">
                          {t('updated_by')}
                        </FormLabel>
                        <FormControl>
                          <Input
                            id="userPermissionUpdatedName"
                            name="userPermissionUpdatedName"
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
                  {/* Spacer */}
                  <div className="md:col-span-1"></div>
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

              {permissionId && (
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
                {permissionId ? t('update') : t('save')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

PermissionDialog.propTypes = {
  openDialog: PropTypes.bool.isRequired,
  onCloseDialog: PropTypes.func.isRequired,
  selectedRow: PropTypes.object,
  onSubmit: PropTypes.func.isRequired,
  onDeleteById: PropTypes.func.isRequired,
  actionDialog: PropTypes.string.isRequired,
  dataEmployees: PropTypes.array.isRequired,
};

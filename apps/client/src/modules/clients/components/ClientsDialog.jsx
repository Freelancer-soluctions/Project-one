import { useEffect } from 'react';
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
import { ClientSchema } from '../utils';
import { useMemo } from 'react';

export const ClientsDialog = ({
  openDialog,
  onCloseDialog,
  selectedRow,
  onSubmit,
  onDeleteById,
  actionDialog,
}) => {
  const { t } = useTranslation();

  const clientId = useMemo(()=> selectedRow?.id ?? null, [selectedRow?.id])

  const form = useForm({
    resolver: zodResolver(ClientSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      address: '',
      createdOn: '',
      updatedOn: '',
      userClientCreatedName: '',
      userClientUpdatedName: '',
    },
  });

  // Actualiza todos los valores del formulario al cambiar `selectedRow`
  useEffect(() => {
    if (selectedRow?.id) {
      // Filtra y mapea solo los valores necesarios
      const mappedValues = {
        id: selectedRow.id,
        name: selectedRow.name,
        email: selectedRow.email,
        phone: selectedRow.phone,
        address: selectedRow.address,
        createdOn: selectedRow.createdOn,
        updatedOn: selectedRow.updatedOn,
        userClientCreatedName: selectedRow.userClientCreatedName,
        userClientUpdatedName: selectedRow.userClientUpdatedName,
      };

      form.reset(mappedValues);
    }

    if (!openDialog) {
      form.reset({
        name: '',
        email: '',
        phone: '',
        address: '',
        createdOn: '',
        updatedOn: '',
        userClientCreatedName: '',
        userClientUpdatedName: '',
      });
    }
  }, [selectedRow, openDialog, form]);

  const handleSubmit = (data) => {
    onSubmit(data, clientId);
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
            {clientId ? t('edit_message') : t('add_message')}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            method="post"
            action=""
            id="client-form"
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
                          placeholder={t('client_name_placeholder')}
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
                name="email"
                render={({ field }) => {
                  return (
                    <FormItem>
                      <FormLabel htmlFor="email">{t('email')}*</FormLabel>
                      <FormControl>
                        <Input
                          id="email"
                          name="email"
                          placeholder={t('client_email_placeholder')}
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
                      <FormLabel htmlFor="phone">{t('phone')}*</FormLabel>
                      <FormControl>
                        <Input
                          id="phone"
                          name="phone"
                          placeholder={t('client_phone_placeholder')}
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
                      <FormLabel htmlFor="address">{t('address')}*</FormLabel>
                      <FormControl>
                        <Input
                          id="address"
                          name="address"
                          placeholder={t('client_address_placeholder')}
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

              {selectedRow?.createdOn && clientId && (
                <>
                  <FormField
                    control={form.control}
                    name="userClientCreatedName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel htmlFor="userClientCreatedName">
                          {t('created_by')}
                        </FormLabel>
                        <FormControl>
                          <Input
                            id="userClientCreatedName"
                            name="userClientCreatedName"
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
                </>
              )}
              {selectedRow?.updatedOn && clientId && (
                <>
                  <FormField
                    control={form.control}
                    name="userClientUpdatedName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel htmlFor="userClientUpdatedName">
                          {t('updated_by')}
                        </FormLabel>
                        <FormControl>
                          <Input
                            id="userClientUpdatedName"
                            name="userClientUpdatedName"
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

              {clientId && (
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
                {clientId ? t('update') : t('save')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

ClientsDialog.propTypes = {
  openDialog: PropTypes.bool.isRequired,
  onCloseDialog: PropTypes.func.isRequired,
  selectedRow: PropTypes.object,
  onSubmit: PropTypes.func.isRequired,
  onDeleteById: PropTypes.func.isRequired,
  actionDialog: PropTypes.string.isRequired,
};

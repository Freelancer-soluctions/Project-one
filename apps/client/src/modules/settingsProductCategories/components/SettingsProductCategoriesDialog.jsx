import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { SettingsProductCategoriesSchema } from '../utils';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { LuFolderTree } from 'react-icons/lu';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import PropTypes from 'prop-types';
import { Textarea } from '@/components/ui/textarea';

export const SettingsProductCategoriesDialog = ({
  openDialog,
  onCloseDialog,
  selectedRow,
  dataStatus,
  onSubmit,
  onDeleteById,
  actionDialog,
}) => {
  const { t } = useTranslation();

  // Configura el formulario
  const form = useForm({
    resolver: zodResolver(SettingsProductCategoriesSchema),
    defaultValues: {
      name: '',
      status: undefined,
      description: '',
    },
  });

  const categoryId = useMemo(() => selectedRow?.id ?? null, [selectedRow?.id]);

  // Actualiza todos los valores del formulario al cambiar `selectedRow`
  useEffect(() => {
    if (selectedRow) {
      // Filtra y mapea solo los valores necesarios
      const mappedValues = {
        id: selectedRow.id || '',
        name: selectedRow.name || '',
        status: selectedRow.status || '',
        code: selectedRow.code || '',
        description: selectedRow.description || '',
        createdOn: selectedRow.createdOn || '',
        updatedOn: selectedRow.updatedOn || '',
        userCategoriesCreatedName: selectedRow.userCategoriesCreatedName || '',
        userCategoriesUpdatedName: selectedRow.userCategoriesUpdatedName || '',
      };

      form.reset(mappedValues);
    }

    if (!openDialog) {
      form.reset();
    }
  }, [selectedRow, openDialog, form]);

  const handleSubmit = (data) => {
    onSubmit({ ...data }, categoryId);
  };

  const handleDeleteById = () => {
    onDeleteById(categoryId);
  };

  return (
    <Dialog
      open={openDialog}
      onOpenChange={(isOpen) => {
        if (isOpen === true) return;
        onCloseDialog();
      }}
    >
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LuFolderTree className="inline mr-3 w-7 h-7" />
            {actionDialog}
          </DialogTitle>
          <DialogDescription>
            {categoryId ? t('edit_message') : t('add_message')}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            method="post"
            action=""
            id="categories-form"
            onSubmit={form.handleSubmit(handleSubmit)}
            noValidate
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
                          placeholder={t('category_name_placeholder')}
                          type="text"
                          autoComplete="off"
                          maxLength={80}
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
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="status">{t('status')}*</FormLabel>
                    <Select
                      onValueChange={(value) =>
                        field.onChange(value === 'true')
                      }
                      value={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger
                          className={cn(
                            'w-full',
                            !field.value && 'text-muted-foreground'
                          )}
                        >
                          <SelectValue
                            placeholder={t('select_status')}
                            className="w-full"
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {dataStatus.map((item, index) => (
                          <SelectItem key={index} value={item.value.toString()}>
                            {item.description}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => {
                  return (
                    <FormItem className="col-span-2">
                      <FormLabel htmlFor="description">
                        {t('description')}
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          id="description"
                          name="description"
                          placeholder={t('category_description_placeholder')}
                          className="resize-none"
                          maxLength={2000}
                          {...field}
                          value={field.value ?? ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
            </div>

            <DialogFooter>
              <div className="flex flex-wrap items-center justify-between gap-3 mt-5 md:justify-normal">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={onCloseDialog}
                >
                  {t('cancel')}
                </Button>
                {categoryId && (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={handleDeleteById}
                  >
                    {t('delete')}
                  </Button>
                )}
                <Button type="submit" variant="info">
                  {t('save')}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

SettingsProductCategoriesDialog.propTypes = {
  openDialog: PropTypes.bool.isRequired,
  onCloseDialog: PropTypes.func.isRequired,
  selectedRow: PropTypes.object,
  dataStatus: PropTypes.array.isRequired,
  onSubmit: PropTypes.func.isRequired,
  onDeleteById: PropTypes.func.isRequired,
  actionDialog: PropTypes.string.isRequired,
};

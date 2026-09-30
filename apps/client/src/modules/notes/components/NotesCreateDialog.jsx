import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { TiptapEditor } from '@/components/tiptap/TiptapEditor';
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
import { useTranslation } from 'react-i18next';
import { CgNotes } from 'react-icons/cg';
import { LuTags, LuStar } from 'react-icons/lu';
import { Switch } from '@/components/ui/switch';
import PropTypes from 'prop-types';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { NotesCreateDialogSchema } from '../utils/index';
import { useGetActiveUsers } from '../hooks/useGetActiveUsers';
import { useGetHashtagItems, useGetNoteColumns } from '../hooks';
import { HashtagsSelector } from './NotesHashtagSelector';
import { FIELD_LIMITS } from '@/config/fieldLimits';

/** Status (column) select field for the create dialog. */
function CreateNoteStatusField({ control, dataColumns }) {
  const { t } = useTranslation();
  return (
    <FormField
      control={control}
      name="status"
      render={({ field }) => (
        <FormItem className="flex flex-col flex-auto">
          <FormLabel htmlFor="status">{t('status')}*</FormLabel>
          <Select
            onValueChange={(code) => {
              // Buscar el objeto completo por el `code`
              const selectedStatus = dataColumns.find(
                (item) => item.code === code
              );
              if (selectedStatus) {
                field.onChange(selectedStatus); // Asignar el objeto completo
              }
            }}
            value={field.value?.code}
          >
            <SelectTrigger>
              <SelectValue placeholder={t('select_status')} />
            </SelectTrigger>
            <SelectContent>
              {dataColumns && dataColumns.length > 0 ? (
                dataColumns.map((col) => (
                  <SelectItem key={col.id} value={col.code}>
                    {col.title}
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="loading" disabled>
                  {t('loading')}
                </SelectItem>
              )}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

CreateNoteStatusField.propTypes = {
  control: PropTypes.object.isRequired,
  dataColumns: PropTypes.array,
};

/** Favorite switch field for the create dialog. */
function CreateFavoriteField({ control }) {
  const { t } = useTranslation();
  return (
    <FormField
      control={control}
      name="isFavorite"
      render={({ field }) => (
        <FormItem className="flex flex-row items-center gap-2 space-y-0">
          <FormControl>
            <Switch
              checked={field.value || false}
              onCheckedChange={field.onChange}
            />
          </FormControl>
          <FormLabel className="cursor-pointer flex items-center gap-1">
            <LuStar className="w-4 h-4 text-amber-500" />
            {t('mark_as_favorite')}
          </FormLabel>
        </FormItem>
      )}
    />
  );
}

CreateFavoriteField.propTypes = {
  control: PropTypes.object.isRequired,
};

/** Hashtags multi-select popover field. */
function HashtagsPopoverField({
  selectedIds,
  onSelectionChange,
  hashtagItems,
  open,
  setOpen,
}) {
  const { t } = useTranslation();
  return (
    <div className="space-y-2">
      <FormLabel>{t('hashtags_title')}</FormLabel>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            type="button"
            className="w-full justify-start gap-2"
          >
            <LuTags className="h-4 w-4" />
            {selectedIds.length > 0
              ? t('hashtags_selected', { count: selectedIds.length })
              : t('hashtags_select_hashtags')}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <HashtagsSelector
            hashtags={hashtagItems}
            selectedIds={selectedIds.map(String)}
            onSelectionChange={(ids) => onSelectionChange(ids.map(Number))}
            onClose={() => setOpen(false)}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

HashtagsPopoverField.propTypes = {
  selectedIds: PropTypes.array.isRequired,
  onSelectionChange: PropTypes.func.isRequired,
  hashtagItems: PropTypes.array,
  open: PropTypes.bool.isRequired,
  setOpen: PropTypes.func.isRequired,
};

/** Note title text field. */
function NoteTitleField({ control }) {
  const { t } = useTranslation();
  return (
    <FormField
      control={control}
      name="title"
      render={({ field }) => (
        <FormItem className="flex flex-col flex-auto col-span-1">
          <FormLabel htmlFor="title">{t('title')}*</FormLabel>
          <FormControl>
            <Input
              id="title"
              {...field}
              placeholder={t('title_placeholder')}
              required
              maxLength={FIELD_LIMITS.notes.title}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

NoteTitleField.propTypes = {
  control: PropTypes.object.isRequired,
};

/** Note content rich-text field for the create dialog. */
function CreateContentField({ control, mentionSuggestions }) {
  const { t } = useTranslation();
  return (
    <FormField
      control={control}
      name="content"
      render={({ field }) => (
        <FormItem className="flex flex-col flex-auto col-span-1">
          <FormLabel htmlFor="content">{t('content')}*</FormLabel>
          <FormControl>
            <TiptapEditor
              value={field.value}
              onChange={field.onChange}
              placeholder={t('content_placeholder')}
              mentionSuggestions={mentionSuggestions}
              characterLimit={FIELD_LIMITS.notes.content}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

CreateContentField.propTypes = {
  control: PropTypes.object.isRequired,
  mentionSuggestions: PropTypes.array,
};

/**
 * Create-dialog form state: RTK wiring, hashtag selection and submit handler.
 */
function useCreateNoteForm({ onCreateNote, setOpen }) {
  const { dataUsers } = useGetActiveUsers();
  const { hashtagItems } = useGetHashtagItems();
  const { dataColumns } = useGetNoteColumns();
  const [selectedHashtagIds, setSelectedHashtagIds] = useState([]);
  const [hashtagOpen, setHashtagOpen] = useState(false);

  const form = useForm({
    resolver: zodResolver(NotesCreateDialogSchema),
    defaultValues: {
      title: '',
      content: '',
      isFavorite: false,
    },
  });

  const onSubmitDialog = (values) => {
    if (values.title.trim() && values.content.trim() && values.status) {
      onCreateNote({ ...values, hashtagIds: selectedHashtagIds });
      setOpen(false);
      form.reset();
      setSelectedHashtagIds([]);
    }
  };

  const handleOpenChange = (isOpen) => {
    if (!isOpen) {
      form.reset();
      setSelectedHashtagIds([]);
      setOpen(false);
    }
    setOpen(isOpen);
  };

  return {
    form,
    dataUsers,
    hashtagItems,
    dataColumns,
    selectedHashtagIds,
    setSelectedHashtagIds,
    hashtagOpen,
    setHashtagOpen,
    onSubmitDialog,
    handleOpenChange,
  };
}

export function NotesCreateDialog({ onCreateNote, open, setOpen }) {
  const { t } = useTranslation();
  const {
    form,
    dataUsers,
    hashtagItems,
    dataColumns,
    selectedHashtagIds,
    setSelectedHashtagIds,
    hashtagOpen,
    setHashtagOpen,
    onSubmitDialog,
    handleOpenChange,
  } = useCreateNoteForm({ onCreateNote, setOpen });

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>
            <CgNotes className="inline mr-3 w-7 h-7" />
            {t('create_note')}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form
            method="post"
            action=""
            id="notes-form"
            noValidate
            onSubmit={form.handleSubmit(onSubmitDialog)}
            className="mt-4 space-y-4"
          >
            <div className="space-y-2">
              <CreateNoteStatusField
                control={form.control}
                dataColumns={dataColumns}
              />
            </div>

            <HashtagsPopoverField
              selectedIds={selectedHashtagIds}
              onSelectionChange={setSelectedHashtagIds}
              hashtagItems={hashtagItems}
              open={hashtagOpen}
              setOpen={setHashtagOpen}
            />

            <div className="flex items-center gap-2">
              <CreateFavoriteField control={form.control} />
            </div>

            <div className="space-y-2">
              <NoteTitleField control={form.control} />
            </div>
            <CreateContentField
              control={form.control}
              mentionSuggestions={dataUsers}
            />
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="secondary">
                  {t('close')}
                </Button>
              </DialogClose>

              <Button type="submit" variant="info">
                {t('save')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

NotesCreateDialog.propTypes = {
  onCreateNote: PropTypes.func.isRequired,
  open: PropTypes.bool.isRequired,
  setOpen: PropTypes.func.isRequired,
};

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { TiptapEditor } from '@/components/tiptap/TiptapEditor';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useTranslation } from 'react-i18next';
import PropTypes from 'prop-types';
import { CgNotes } from 'react-icons/cg';
import { LuTags, LuStar } from 'react-icons/lu';
import { Switch } from '@/components/ui/switch';
import { useGetActiveUsers, useGetHashtagItems, useGetNoteColumns } from '../hooks';
import { FIELD_LIMITS } from '@/config/fieldLimits';
import { HashtagsSelector } from './NotesHashtagSelector';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { notesEditDialogSchema } from '../utils';
import { pickDirty } from '@/utils/pickDirty';


export function NotesEditDialog({ open, onOpenChange, onEditNote, note }) {
  const { t } = useTranslation();
  const { dataUsers } = useGetActiveUsers();
  const { hashtagItems } = useGetHashtagItems();
  const { dataColumns } = useGetNoteColumns();

  const form = useForm({
    resolver: zodResolver(notesEditDialogSchema),
    defaultValues: { title: '', content: '', status: undefined, hashtagIds: [], isFavorite: false },
  });
  const { control, setValue, reset, formState: { dirtyFields } } = form;
  const [hashtagOpen, setHashtagOpen] = useState(false);

  // Single source of truth: useWatch returns plain value, safe for React Compiler
  const hashtagIds = useWatch({ control, name: 'hashtagIds' });

  // Derive valid IDs at render time — handles external deletion without setState in effect
  const hashtagIdSet = useMemo(() => {
    if (!hashtagItems) return new Set();
    return new Set(hashtagItems.map((h) => Number(h.id)));
  }, [hashtagItems]);

  const validSelectedIds = useMemo(() => {
    return (hashtagIds || []).filter((id) => hashtagIdSet.has(id));
  }, [hashtagIds, hashtagIdSet]);

  // Initialize form when dialog opens with a note
  useEffect(() => {
    if (open && note) {
      const currentColumn = dataColumns?.find((c) => c.id === note.columnId);
      const ids = note.hashtags ? note.hashtags.map((h) => h.id) : [];
      reset({
        ...note,
        isFavorite: note.isFavorited ?? false,
        status: currentColumn,
        hashtagIds: ids,
      });
    }
  }, [open, note, dataColumns, reset]);

  const handleHashtagSelectionChange = useCallback((ids) => {
    const numericIds = ids.map(Number);
    setValue('hashtagIds', numericIds, { shouldDirty: true });
  }, [setValue]);

  const handleSubmit = form.handleSubmit((values) => {
    const changes = pickDirty(values, dirtyFields);
    const body = {};
    if (changes.title !== undefined) body.title = changes.title;
    if (changes.content !== undefined) body.content = changes.content;
    if (changes.status !== undefined) body.columnId = changes.status.id;
    if (changes.hashtagIds !== undefined) body.hashtagIds = changes.hashtagIds;
    if (changes.isFavorite !== undefined) body.isFavorite = changes.isFavorite;
    onEditNote({ id: values.id, body });
    form.reset();
    onOpenChange(false);
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>
            <CgNotes className="inline mr-3 w-7 h-7" />
            {t('edit_note')}
          </DialogTitle>
        </DialogHeader>
          <Form {...form}>
          <form
            method="post"
            action=""
            id="notes-edit-form"
            noValidate
            onSubmit={handleSubmit}
            className="mt-4 space-y-4"
          >
            <div className="space-y-2">
              <FormField
                control={control}
                name="title"
                render={({ field }) => {
                  return (
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
                  );
                }}
              />
            </div>

             {/* Favorite switch */}
            <div className="flex items-center gap-2">
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
            </div>

            {/* Hashtags selector */}
             <div className="space-y-2">
               <FormLabel>{t('hashtags_title')}</FormLabel>
               <Popover open={hashtagOpen} onOpenChange={setHashtagOpen}>
                  <PopoverTrigger asChild>
                   <Button variant="outline" type="button" className="w-full justify-start gap-2">
                     <LuTags className="h-4 w-4" />
                      {validSelectedIds.length > 0
                        ? t('hashtags_selected', { count: validSelectedIds.length })
                       : t('hashtags_select_hashtags')}
                   </Button>
                 </PopoverTrigger>
                 <PopoverContent className="w-auto p-0" align="start">
                    <HashtagsSelector
                      hashtags={hashtagItems}
                       selectedIds={validSelectedIds.map(String)}
                      onSelectionChange={handleHashtagSelectionChange}
                      onClose={() => setHashtagOpen(false)}
                    />
                 </PopoverContent>
               </Popover>
             </div>

             {/* Status field */}
             <div className="space-y-2">
               <FormField
                 control={control}
                 name="status"
                 render={({ field }) => (
                   <FormItem className="flex flex-col flex-auto">
                     <FormLabel htmlFor="edit-status">{t('status')}*</FormLabel>
                     <Select
                       onValueChange={(code) => {
                         const selectedStatus = dataColumns?.find(
                           (item) => item.code === code
                         );
                         if (selectedStatus) {
                           field.onChange(selectedStatus);
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
             </div>

             <div className="space-y-2">
              <FormField
                control={control}
                name="content"
                render={({ field }) => {
                  return (
                    <FormItem className="flex flex-col flex-auto col-span-1">
                      <FormLabel htmlFor="content">{t('content')}*</FormLabel>
                      <FormControl>
<TiptapEditor
                           value={field.value}
                           onChange={field.onChange}
                           placeholder={t('content_placeholder')}
                           mentionSuggestions={dataUsers}
                           characterLimit={FIELD_LIMITS.notes.content}
                         />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
            </div>
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

NotesEditDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onOpenChange: PropTypes.func.isRequired,
  onEditNote: PropTypes.func.isRequired,
  note: PropTypes.object,
};

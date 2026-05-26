import { useState, useEffect } from 'react';
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
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { CgNotes } from 'react-icons/cg';
import { LuTags } from 'react-icons/lu';
import { notesEditDialogSchema } from '../utils/index';
import { useGetActiveUsers, useGetHashtagItems } from '../hooks';
import { NOTES_FIELD_LIMITS } from '../constant/enums/enums';
import { HashtagsSelector } from './NotesHashtagSelector';


export function NotesEditDialog({ open, onOpenChange, onEditNote, note }) {
  const { t } = useTranslation();
  const { dataUsers, isLoadingUsers, isFetchingUsers } = useGetActiveUsers();
  const { hashtagItems } = useGetHashtagItems();
  const [selectedHashtagIds, setSelectedHashtagIds] = useState([]);

  // Sync selected IDs with existing hashtags
  // Handles: hashtag deleted externally (from NotesFilters) while dialog open
  useEffect(() => {
    if (!hashtagItems || hashtagItems.length === 0) return;
    const validIds = new Set(hashtagItems.map((h) => Number(h.id)));
    setSelectedHashtagIds((prev) => prev.filter((id) => validIds.has(id)));
  }, [hashtagItems]);

  const formEditNotesDialog = useForm({
    resolver: zodResolver(notesEditDialogSchema),
    defaultValues: {
      ...note,
      hashtagIds: [],
    },
  });

  useEffect(() => {
    if (note) {
      const noteHashtagIds = note.hashtags
        ? note.hashtags.map((h) => h.id)
        : [];
      setSelectedHashtagIds(noteHashtagIds);
      formEditNotesDialog.reset({
        ...note,
        hashtagIds: noteHashtagIds,
      });
    }
  }, [note, formEditNotesDialog]);

  const onEditSubmitDialog = (values) => {
    if (values.title.trim() && values.content.trim()) {
      onEditNote({ ...values, hashtagIds: selectedHashtagIds });
      onOpenChange(false);
      setSelectedHashtagIds([]);
      formEditNotesDialog.reset();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>
            <CgNotes className="inline mr-3 w-7 h-7" />
            {t('edit_note')}
          </DialogTitle>
        </DialogHeader>
        <Form {...formEditNotesDialog}>
          <form
            method="post"
            action=""
            id="notes-edit-form"
            noValidate
            onSubmit={formEditNotesDialog.handleSubmit(onEditSubmitDialog)}
            className="mt-4 space-y-4"
          >
            <div className="space-y-2">
              <FormField
                control={formEditNotesDialog.control}
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
                          maxLength={50}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
            </div>

            {/* Hashtags selector */}
            <div className="space-y-2">
              <FormLabel>{t('hashtags_title')}</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" type="button" className="w-full justify-start gap-2">
                    <LuTags className="h-4 w-4" />
                    {selectedHashtagIds.length > 0
                      ? t('hashtags_selected', { count: selectedHashtagIds.length })
                      : t('hashtags_select_hashtags')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                   <HashtagsSelector
                     hashtags={hashtagItems}
                     selectedIds={selectedHashtagIds.map(String)}
                     onSelectionChange={(ids) => setSelectedHashtagIds(ids.map(Number))}
                     onClose={() => {}}
                   />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <FormField
                control={formEditNotesDialog.control}
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
                          characterLimit={NOTES_FIELD_LIMITS.content}
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
  note: PropTypes.object.isRequired,
};

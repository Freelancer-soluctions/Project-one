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
import { useGetHashtagItems } from '../hooks';
import { useGetNoteColumns } from '../hooks';
import { HashtagsSelector } from './NotesHashtagSelector';
import { FIELD_LIMITS } from '@/config/fieldLimits'

export function NotesCreateDialog({ onCreateNote, open, setOpen }) {
  const { t } = useTranslation();
  const { dataUsers } = useGetActiveUsers();
  const { hashtagItems } = useGetHashtagItems();
  const { dataColumns } = useGetNoteColumns();
  const [selectedHashtagIds, setSelectedHashtagIds] = useState([]);
  const [hashtagOpen, setHashtagOpen] = useState(false);

  // Configura el formulario
  const formNotesDialog = useForm({
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
      formNotesDialog.reset();
      setSelectedHashtagIds([]);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          formNotesDialog.reset();
          setSelectedHashtagIds([]);
          setOpen(false);
        }
        setOpen(isOpen);
      }}
    >
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>
            <CgNotes className="inline mr-3 w-7 h-7" />
            {t('create_note')}
          </DialogTitle>
        </DialogHeader>

        <Form {...formNotesDialog}>
          <form
            method="post"
            action=""
            id="notes-form"
            noValidate
            onSubmit={formNotesDialog.handleSubmit(onSubmitDialog)}
            className="mt-4 space-y-4"
          >
            <div className="space-y-2">
              <FormField
                control={formNotesDialog.control}
                name="status"
                render={({ field }) => {
                  return (
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
                  );
                }}
              />
            </div>

            {/* Hashtags selector */}
            <div className="space-y-2">
              <FormLabel>{t('hashtags_title')}</FormLabel>
              <Popover open={hashtagOpen} onOpenChange={setHashtagOpen}>
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
                    onClose={() => setHashtagOpen(false)}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Favorite switch */}
            <div className="flex items-center gap-2">
              <FormField
                control={formNotesDialog.control}
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

            <div className="space-y-2">
              <FormField
                control={formNotesDialog.control}
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
            <div className="space-y-2">
              <FormField
                control={formNotesDialog.control}
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

NotesCreateDialog.propTypes = {
  onCreateNote: PropTypes.func.isRequired,
  open: PropTypes.bool.isRequired,
  setOpen: PropTypes.func.isRequired,
};

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { TiptapEditor } from '@/components/tiptap/TiptapEditor';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { useGetMentionsByNoteIdQuery } from '../api/notesAPI';
import { useGetNoteColumns } from '../hooks';
import { Spinner } from '@/components/loader/Spinner';
import { CgNotes } from 'react-icons/cg';
import PropTypes from 'prop-types';
import { useMemo } from 'react';

/** Status (column) row: loading spinner, hidden on error, label otherwise. */
function ViewStatusRow({ isLoadingColumns, isErrorColumns, column }) {
  const { t } = useTranslation();
  if (isLoadingColumns) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Spinner className="w-4 h-4" />
        <span>{t('loading')}...</span>
      </div>
    );
  }
  if (isErrorColumns || !column) return null;
  return (
    <p className="text-sm text-muted-foreground">
      {t('status')}: {t(column.title, column.title)}
    </p>
  );
}

ViewStatusRow.propTypes = {
  isLoadingColumns: PropTypes.bool,
  isErrorColumns: PropTypes.bool,
  column: PropTypes.object,
};

/** "Mentioned by" row: loading spinner, hidden on error, avatar+name otherwise. */
function ViewMentionedByRow({
  isLoadingMentions,
  isErrorMentions,
  mentionedByUser,
}) {
  const { t } = useTranslation();
  if (isLoadingMentions) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Spinner className="w-4 h-4" />
        <span>{t('loading')}...</span>
      </div>
    );
  }
  if (isErrorMentions || !mentionedByUser) return null;
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-muted-foreground">{t('mentioned_by')}:</span>
      <div className="flex items-center gap-1.5">
        {mentionedByUser.picture && (
          <img
            src={mentionedByUser.picture}
            alt={mentionedByUser.name}
            className="w-5 h-5 rounded-full"
          />
        )}
        <span className="font-medium">{mentionedByUser.name}</span>
      </div>
    </div>
  );
}

ViewMentionedByRow.propTypes = {
  isLoadingMentions: PropTypes.bool,
  isErrorMentions: PropTypes.bool,
  mentionedByUser: PropTypes.object,
};

/** Read-only view data: matching column and first mention author. */
function useViewNoteData(note, open) {
  const { dataColumns, isLoadingColumns, isErrorColumns } = useGetNoteColumns();
  const {
    data: mentions,
    isLoading: isLoadingMentions,
    isError: isErrorMentions,
  } = useGetMentionsByNoteIdQuery(note.id, { skip: !open });

  const column = useMemo(() => {
    if (!dataColumns || !note.columnId) return null;
    return dataColumns.find((c) => c.id === note.columnId) ?? null;
  }, [dataColumns, note.columnId]);

  const mentionedByUser = useMemo(() => {
    if (!mentions || !Array.isArray(mentions)) return null;
    // Find mention where mentionedUser is current user (non-owner)
    // Return the mentionedByUser info
    const mention = mentions[0];
    return mention?.mentionedByUser ?? null;
  }, [mentions]);

  return {
    isLoadingColumns,
    isErrorColumns,
    column,
    isLoadingMentions,
    isErrorMentions,
    mentionedByUser,
  };
}

export function NotesViewDialog({ note, open, onOpenChange }) {
  const { t } = useTranslation();
  const {
    isLoadingColumns,
    isErrorColumns,
    column,
    isLoadingMentions,
    isErrorMentions,
    mentionedByUser,
  } = useViewNoteData(note, open);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>
            <CgNotes className="inline mr-3 w-7 h-7" />
            {t('note_view')}
          </DialogTitle>
        </DialogHeader>

        <div className="mt-2 space-y-4">
          {/* Title — first (matches edit order) */}
          {note.title && (
            <h3 className="text-lg font-semibold">{note.title}</h3>
          )}

          {/* Hashtags — second */}
          {note.hashtags && note.hashtags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {note.hashtags.map((h) => (
                <span
                  key={h.id}
                  className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary"
                >
                  #{h.name}
                </span>
              ))}
            </div>
          )}

          {/* Status/Column — third */}
          <ViewStatusRow
            isLoadingColumns={isLoadingColumns}
            isErrorColumns={isErrorColumns}
            column={column}
          />

          {/* Content — fourth (same TiptapEditor as edit, disabled for view) */}
          <TiptapEditor
            value={note.content}
            disabled={true}
            className="[&_>div:first-child]:hidden [&_>div:last-child]:hidden"
          />

          {/* Date — after content */}
          {note.createdOn && (
            <p className="text-sm text-muted-foreground">
              {t('created_on')}: {format(note.createdOn, 'PPP')}
            </p>
          )}

          {/* Mentioned by */}
          <ViewMentionedByRow
            isLoadingMentions={isLoadingMentions}
            isErrorMentions={isErrorMentions}
            mentionedByUser={mentionedByUser}
          />
        </div>

        <div className="mt-4 flex justify-end">
          <DialogClose asChild>
            <Button type="button" variant="secondary">
              {t('close')}
            </Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
}

NotesViewDialog.propTypes = {
  note: PropTypes.object.isRequired,
  open: PropTypes.bool.isRequired,
  onOpenChange: PropTypes.func.isRequired,
};

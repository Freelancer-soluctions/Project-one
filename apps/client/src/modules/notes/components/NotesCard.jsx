import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { LuTrash2, LuPencil, LuCheck, LuEye } from 'react-icons/lu';
import { Button } from '@/components/ui/button';
import { NotesEditDialog } from './NotesEditDialog';
import { NotesViewDialog } from './NotesViewDialog';
import { FavoriteToggle } from '@/components/favoriteToggle/favoriteToggle';
import { useToggleFavoriteMutation } from '../api/notesAPI';
import { useTranslation } from 'react-i18next';
import { useSocket } from '@/hooks/useSocket';
import { format } from 'date-fns';
import PropTypes from 'prop-types';
import { NOTE_CARD_STYLES } from '../utils/noteStyles';
import { toast } from '@/components/ui/use-toast';

/** Owner quick-actions: edit + delete. */
function OwnerActions({ onEdit, onDelete }) {
  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="w-8 h-8 text-gray-500 hover:text-blue-600"
        onClick={(e) => {
          e.preventDefault();
          onEdit();
        }}
      >
        <LuPencil className="w-4 h-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="w-8 h-8 text-gray-500 hover:text-red-600"
        onClick={(e) => {
          e.preventDefault();
          onDelete();
        }}
      >
        <LuTrash2 className="w-4 h-4" />
      </Button>
    </>
  );
}

OwnerActions.propTypes = {
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};

/** Mention quick-actions: view + mark-as-read. */
function MentionActions({ onView, onMarkAsRead }) {
  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="w-8 h-8 text-gray-500 hover:text-green-600"
        onClick={(e) => {
          e.preventDefault();
          onView();
        }}
      >
        <LuEye className="w-4 h-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="w-8 h-8 text-gray-500 hover:text-blue-600"
        onClick={onMarkAsRead}
      >
        <LuCheck className="w-4 h-4" />
      </Button>
    </>
  );
}

MentionActions.propTypes = {
  onView: PropTypes.func.isRequired,
  onMarkAsRead: PropTypes.func.isRequired,
};

/** Badges shown on a mentioned (non-owner) card header. */
function MentionBadges({ hasUnreadMentions }) {
  const { t } = useTranslation();
  return (
    <>
      <span className="bg-blue-500 text-white text-xs rounded-full px-1.5 py-0.5 ml-2">
        {t('mentioned_badge')}
      </span>
      {hasUnreadMentions && (
        <span
          className="w-2 h-2 rounded-full bg-blue-600 ml-1 inline-block"
          title={t('unread_mentions')}
        />
      )}
    </>
  );
}

MentionBadges.propTypes = {
  hasUnreadMentions: PropTypes.bool,
};

/** Card header: favorite toggle, title, mention badges, hover actions. */
function NoteCardHeader({
  cardStyles,
  isOwner,
  isMentioned,
  favoriteToggle,
  title,
  badges,
  actions,
}) {
  return (
    <CardHeader
      className={cn(
        'font-semibold p-3 flex flex-row items-center justify-between',
        cardStyles,
        !isOwner && 'bg-gray-50'
      )}
    >
      <div className="flex items-center gap-1 min-w-0 truncate">
        {isOwner && favoriteToggle}
        <span className="truncate">{title}</span>
        {isMentioned && badges}
      </div>
      <div className="flex gap-1 transition-opacity opacity-0 group-hover:opacity-100 shrink-0">
        {actions}
      </div>
    </CardHeader>
  );
}

NoteCardHeader.propTypes = {
  cardStyles: PropTypes.string,
  isOwner: PropTypes.bool.isRequired,
  isMentioned: PropTypes.bool.isRequired,
  favoriteToggle: PropTypes.node,
  title: PropTypes.string.isRequired,
  badges: PropTypes.node,
  actions: PropTypes.node,
};

/** Favorite-toggle and mark-as-read actions for a note card. */
function useNoteCardActions({ note, toggleFavorite }) {
  const { t } = useTranslation();
  const { socket } = useSocket();

  const handleToggleFavorite = async () => {
    try {
      await toggleFavorite(note.id).unwrap();
    } catch {
      toast({
        title: t('error'),
        description: t('error_occurred_message'),
        variant: 'destructive',
      });
    }
  };

  const handleMarkAsRead = () => {
    if (socket && note.mentionIds?.length) {
      socket.emit('message', {
        type: 'mention:read',
        payload: { mentionIds: note.mentionIds },
      });
    }
  };

  return { handleToggleFavorite, handleMarkAsRead };
}

/** Edit and view dialogs controlled by the card. */
function buildNoteDialogs({
  note,
  onEdit,
  isEditDialogOpen,
  setIsEditDialogOpen,
  isViewDialogOpen,
  setIsViewDialogOpen,
}) {
  return (
    <>
      <NotesEditDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onEditNote={onEdit}
        note={note}
      />

      <NotesViewDialog
        note={note}
        open={isViewDialogOpen}
        onOpenChange={setIsViewDialogOpen}
      />
    </>
  );
}

export function NotesCard({ note, onDragStart, onDelete, onEdit, columnCode }) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [toggleFavorite, { isLoading: isTogglingFav }] =
    useToggleFavoriteMutation();
  const { t } = useTranslation();

  const { isOwner, isMentioned, hasUnreadMentions } = note;

  const cardStyles = NOTE_CARD_STYLES[note.color] || NOTE_CARD_STYLES.gray;

  const { handleToggleFavorite, handleMarkAsRead } = useNoteCardActions({
    note,
    toggleFavorite,
  });

  return (
    <>
      <Card
        draggable={isOwner}
        onDragStart={
          isOwner ? (e) => onDragStart(e, note.id, columnCode) : undefined
        }
        className={cn(
          isOwner ? 'cursor-move' : 'cursor-default',
          'transition-all duration-200 hover:shadow-lg group',
          cardStyles.card,
          !isOwner && 'border-dashed border-gray-400/50',
          isMentioned && !isOwner && 'border-l-4 border-l-blue-400'
        )}
      >
        <NoteCardHeader
          cardStyles={cardStyles.header}
          isOwner={isOwner}
          isMentioned={isMentioned && !isOwner}
          title={note.title}
          favoriteToggle={
            <FavoriteToggle
              checked={note.isFavorited}
              onChange={handleToggleFavorite}
              isLoading={isTogglingFav}
              size="sm"
              className="p-0 hover:bg-transparent"
            />
          }
          badges={<MentionBadges hasUnreadMentions={hasUnreadMentions} />}
          actions={
            <>
              {isOwner && (
                <OwnerActions
                  onEdit={() => setIsEditDialogOpen(true)}
                  onDelete={() => onDelete(note.id)}
                />
              )}
              {isMentioned && !isOwner && (
                <MentionActions
                  onView={() => setIsViewDialogOpen(true)}
                  onMarkAsRead={handleMarkAsRead}
                />
              )}
            </>
          }
        />
        <CardContent className="p-3 pt-0">
          <p className="text-sm text-gray-600">
            {t('created_on')}: {format(note.createdOn, 'PPP')}
          </p>
        </CardContent>
      </Card>

      {buildNoteDialogs({
        note,
        onEdit,
        isEditDialogOpen,
        setIsEditDialogOpen,
        isViewDialogOpen,
        setIsViewDialogOpen,
      })}
    </>
  );
}

NotesCard.propTypes = {
  note: PropTypes.object.isRequired,
  onDragStart: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  columnCode: PropTypes.string.isRequired,
};

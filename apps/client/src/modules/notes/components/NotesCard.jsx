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

export function NotesCard({ note, onDragStart, onDelete, onEdit, columnCode }) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [toggleFavorite, { isLoading: isTogglingFav }] = useToggleFavoriteMutation();
  const { t } = useTranslation();
  const { socket } = useSocket();

  const { isOwner, isMentioned, hasUnreadMentions } = note;

  const cardStyles = NOTE_CARD_STYLES[note.color] || NOTE_CARD_STYLES.gray;

  const handleToggleFavorite = async (newState) => {
    try {
      await toggleFavorite(note.id).unwrap();
    } catch (err) {
      toast({
        title: t('error'),
        description: t('error_occurred_message'),
        variant: 'destructive',
      });
    }
  };

  const handleMarkAsRead = () => {
    if (socket && note.mentionIds?.length) {
      socket.emit('message', { type: 'mention:read', payload: { mentionIds: note.mentionIds } });
    }
  };

  return (
    <>
      <Card
        draggable={isOwner}
        onDragStart={isOwner ? (e) => onDragStart(e, note.id, columnCode) : undefined}
         className={cn(
           isOwner ? 'cursor-move' : 'cursor-default', 'transition-all duration-200 hover:shadow-lg group',
           cardStyles.card,
           !isOwner && 'border-dashed border-gray-400/50',
           isMentioned && !isOwner && 'border-l-4 border-l-blue-400'
         )}
      >
        <CardHeader
          className={cn(
            'font-semibold p-3 flex flex-row items-center justify-between',
            cardStyles.header,
            !isOwner && 'bg-gray-50'
          )}
        >
          <div className="flex items-center gap-1 min-w-0 truncate">
            {isOwner && (
              <FavoriteToggle
                checked={note.isFavorited}
                onChange={handleToggleFavorite}
                isLoading={isTogglingFav}
                size="sm"
                className="p-0 hover:bg-transparent"
              />
            )}
            <span className="truncate">{note.title}</span>
            {isMentioned && !isOwner && (
              <>
                <span className="bg-blue-500 text-white text-xs rounded-full px-1.5 py-0.5 ml-2">
                  {t('mentioned_badge')}
                </span>
                {hasUnreadMentions && (
                  <span className="w-2 h-2 rounded-full bg-blue-600 ml-1 inline-block" title={t('unread_mentions')} />
                )}
              </>
            )}
          </div>
          <div className="flex gap-1 transition-opacity opacity-0 group-hover:opacity-100 shrink-0">
            {isOwner && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-8 h-8 text-gray-500 hover:text-blue-600"
                  onClick={(e) => {
                    e.preventDefault();
                    setIsEditDialogOpen(true);
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
                    onDelete(note.id);
                  }}
                >
                  <LuTrash2 className="w-4 h-4" />
                </Button>
              </>
            )}
            {isMentioned && !isOwner && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-8 h-8 text-gray-500 hover:text-green-600"
                  onClick={(e) => {
                    e.preventDefault();
                    setIsViewDialogOpen(true);
                  }}
                >
                  <LuEye className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-8 h-8 text-gray-500 hover:text-blue-600"
                  onClick={handleMarkAsRead}
                >
                  <LuCheck className="w-4 h-4" />
                </Button>
              </>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-3 pt-0">
          <p className="text-sm text-gray-600">
            {t('created_on')}: {format(note.createdOn, 'PPP')}
          </p>
        </CardContent>
      </Card>

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

NotesCard.propTypes = {
  note: PropTypes.object.isRequired,
  onDragStart: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  columnCode: PropTypes.string.isRequired,
};

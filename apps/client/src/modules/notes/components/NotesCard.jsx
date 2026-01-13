import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { LuTrash2, LuPencil } from 'react-icons/lu';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { NotesEditDialog } from './NotesEditDialog';
import { NotesColor } from '../utils/index';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import PropTypes from 'prop-types';

export function NotesCard({ note, onDragStart, onDelete, onEdit, columnCode }) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { t } = useTranslation();

  return (
    <>
      <Card
        draggable
        onDragStart={(e) => onDragStart(e, note.id, columnCode)}
        className={cn(
          'cursor-move transition-all duration-200 hover:shadow-lg group',
          note.color === NotesColor.YELLOW &&
            'bg-yellow-50 hover:bg-yellow-100 border-yellow-200',
          note.color === NotesColor.GREEN &&
            'bg-green-50 hover:bg-green-100 border-green-200',
          note.color === NotesColor.RED &&
            'bg-red-50 hover:bg-red-100 border-red-200'
        )}
      >
        <CardHeader
          className={cn(
            'font-semibold p-3 flex flex-row items-center justify-between',
            note.color === NotesColor.YELLOW && 'text-yellow-700',
            note.color === NotesColor.GREEN && 'text-green-700',
            note.color === NotesColor.RED && 'text-red-700'
          )}
        >
          {note.title}
          <div className="flex gap-1 transition-opacity opacity-0 group-hover:opacity-100">
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
          </div>
        </CardHeader>
        <CardContent className="p-3 pt-0">
          <p className="text-sm text-gray-600">{note.content}</p>
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

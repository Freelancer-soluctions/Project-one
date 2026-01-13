import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { NotesCard } from './NotesCard';
import { useTranslation } from 'react-i18next';
import { StatusColumn } from '../utils/index';
import PropTypes from 'prop-types';

export function NotesColumn({
  column,
  onDragStart,
  onDragOver,
  onDrop,
  onDeleteNote,
  onEditNote,
}) {
  const { t } = useTranslation();
  return (
    <Card
      className={cn(
        'flex-1 shadow-lg min-w-[280px]',
        column.code === StatusColumn.LOW &&
          'border-green-200 shadow-green-100/50',
        column.code === StatusColumn.MEDIUM &&
          'border-yellow-200 shadow-yellow-100/50',
        column.code === StatusColumn.HIGH && 'border-red-200 shadow-red-100/50'
      )}
    >
      <CardHeader
        className={cn(
          'text-lg font-bold text-center border-b py-4 flex items-center justify-between',
          column.code === StatusColumn.LOW && 'bg-green-50 text-green-700',
          column.code === StatusColumn.MEDIUM && 'bg-yellow-50 text-yellow-700',
          column.code === StatusColumn.HIGH && 'bg-red-50 text-red-700'
        )}
      >
        <span>{column.title}</span>
        <span className="text-sm font-normal">
          {column.notes.length}{' '}
          {column.notes.length === 1 ? t('note') : t('notes')}
        </span>
      </CardHeader>
      <CardContent
        className="p-0"
        onDragOver={onDragOver}
        onDrop={(e) => onDrop(e, column.code)}
      >
        <ScrollArea className="h-[600px] p-4">
          {column.notes.length > 0 ? (
            <div className="pr-4 space-y-4">
              {column.notes.map((note) => (
                <NotesCard
                  key={note.id}
                  note={note}
                  onDragStart={onDragStart}
                  onDelete={onDeleteNote}
                  onEdit={onEditNote}
                  columnCode={column.code}
                />
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full italic text-gray-400">
              {t('no_notes')}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

NotesColumn.propTypes = {
  column: PropTypes.object.isRequired,
  onDragStart: PropTypes.func.isRequired,
  onDragOver: PropTypes.func.isRequired,
  onDrop: PropTypes.func.isRequired,
  onDeleteNote: PropTypes.func.isRequired,
  onEditNote: PropTypes.func.isRequired,
};

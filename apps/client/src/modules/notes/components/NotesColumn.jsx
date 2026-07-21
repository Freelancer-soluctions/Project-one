import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { NotesCard } from './NotesCard';
import { useTranslation } from 'react-i18next';
import { COLUMN_STYLES } from '../utils/noteStyles';
import PropTypes from 'prop-types';

export function NotesColumn({
  data,
  onDragStart,
  onDragOver,
  onDrop,
  onDeleteNote,
  onEditNote,
}) {
  const { t } = useTranslation();
  return data && data.length > 0 ? (
    <>
      {data.map((column) => (
        <Card
          key={column.code}
          className={cn(
            'flex-1 shadow-lg min-w-[280px]',
            COLUMN_STYLES[column.code]?.card
          )}
        >
          <CardHeader
            className={cn(
              'text-lg font-bold text-center border-b py-4 flex items-center justify-between',
              COLUMN_STYLES[column.code]?.header
            )}
          >
            <span>{t(column.title, column.title)}</span>
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
      ))}
    </>
  ) : (
    <div className="flex flex-1 items-center justify-center text-lg text-muted-foreground">
      {t('no_notes')}
    </div>
  );
}

NotesColumn.propTypes = {
  data: PropTypes.array.isRequired,
  onDragStart: PropTypes.func.isRequired,
  onDragOver: PropTypes.func.isRequired,
  onDrop: PropTypes.func.isRequired,
  onDeleteNote: PropTypes.func.isRequired,
  onEditNote: PropTypes.func.isRequired,
};

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { NotesCard } from './NotesCard'

export function NotesColumn({
  column,
  onDragStart,
  onDragOver,
  onDrop,
  onDeleteNote,
  onEditNote
}) {
  return (
    <Card
      className={cn(
        'flex-1 shadow-lg min-w-[280px]',
        column.id === 'col1' && 'border-green-200 shadow-green-100/50',
        column.id === 'col2' && 'border-yellow-200 shadow-yellow-100/50',
        column.id === 'col3' && 'border-red-200 shadow-red-100/50'
      )}>
      <CardHeader
        className={cn(
          'text-lg font-bold text-center border-b py-4 flex items-center justify-between',
          column.id === 'col1' && 'bg-green-50 text-green-700',
          column.id === 'col2' && 'bg-yellow-50 text-yellow-700',
          column.id === 'col3' && 'bg-red-50 text-red-700'
        )}>
        <span>{column.title}</span>
        <span className='text-sm font-normal'>
          {column.notes.length} {column.notes.length === 1 ? 'nota' : 'notas'}
        </span>
      </CardHeader>
      <CardContent
        className='p-0'
        onDragOver={onDragOver}
        onDrop={e => onDrop(e, column.id)}>
        <ScrollArea className='h-[600px] p-4'>
          {column.notes.length > 0 ? (
            <div className='pr-4 space-y-4'>
              {column.notes.map(note => (
                <NotesCard
                  key={note.id}
                  {...note}
                  onDragStart={onDragStart}
                  onDelete={onDeleteNote}
                  onEdit={onEditNote}
                  columnId={column.id}
                />
              ))}
            </div>
          ) : (
            <div className='flex items-center justify-center h-full italic text-gray-400'>
              No hay notas que mostrar
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

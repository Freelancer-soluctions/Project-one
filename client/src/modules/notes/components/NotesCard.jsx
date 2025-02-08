import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { LuTrash2, LuPencil } from 'react-icons/lu'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { NotesEditDialog } from './NotesEditDialog'
import { NotesColor } from '../utils/index'

export function NotesCard({
  id,
  title,
  content,
  color,
  onDragStart,
  onDelete,
  onEdit,
  columnCode
}) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  return (
    <>
      <Card
        draggable
        onDragStart={e => onDragStart(e, id, columnCode)}
        className={cn(
          'cursor-move transition-all duration-200 hover:shadow-lg group',
          color === NotesColor.YELLOW &&
            'bg-yellow-50 hover:bg-yellow-100 border-yellow-200',
          color === NotesColor.GREEN &&
            'bg-green-50 hover:bg-green-100 border-green-200',
          color === NotesColor.RED &&
            'bg-red-50 hover:bg-red-100 border-red-200'
        )}>
        <CardHeader
          className={cn(
            'font-semibold p-3 flex flex-row items-center justify-between',
            color === NotesColor.YELLOW && 'text-yellow-700',
            color === NotesColor.GREEN && 'text-green-700',
            color === NotesColor.RED && 'text-red-700'
          )}>
          {title}
          <div className='flex gap-1 transition-opacity opacity-0 group-hover:opacity-100'>
            <Button
              variant='ghost'
              size='icon'
              className='w-8 h-8 text-gray-500 hover:text-blue-600'
              onClick={e => {
                e.preventDefault()
                setIsEditDialogOpen(true)
              }}>
              <LuPencil className='w-4 h-4' />
            </Button>
            <Button
              variant='ghost'
              size='icon'
              className='w-8 h-8 text-gray-500 hover:text-red-600'
              onClick={e => {
                e.preventDefault()
                onDelete(id)
              }}>
              <LuTrash2 className='w-4 h-4' />
            </Button>
          </div>
        </CardHeader>
        <CardContent className='p-3 pt-0'>
          <p className='text-sm text-gray-600'>{content}</p>
        </CardContent>
      </Card>

      <NotesEditDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onEditNote={onEdit}
        noteId={id}
        initialTitle={title}
        initialContent={content}
      />
    </>
  )
}

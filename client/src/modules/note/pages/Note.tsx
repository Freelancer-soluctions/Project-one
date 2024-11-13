import { Button } from '@/components/ui/button'
import { SetStateAction, useState } from 'react'
import NoteDialog from '../components/dialog'
import useGetNotes from '../hooks/useGetNotes'
import useDeleteNoteMutation from '../hooks/useDeleteNoteMutation'

interface NoteType {
  id: string | number;
}

const Note = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedNote, setSelectedNote] = useState<NoteType | null>(null);
  const useDeleteMutation = useDeleteNoteMutation()

  useGetNotes()

  const onDelete = (selectedRow: { id: string | number }) => useDeleteMutation.mutate(selectedRow.id)

  const onEdit = (selectedRow: NoteType) => {
    setSelectedNote(selectedRow);
    setIsDialogOpen(true);
  };


  const onOpenChangeDialog = (value: boolean) => {
    setIsDialogOpen(value);
    if (!value) {
      setSelectedNote(null);
    }
  };

  return (
    <section className='py-16'>
      <div className='container'>
        <h1 className='text-3xl font-bold'>Notes</h1>
        <Button onClick={() => setIsDialogOpen(true)}> Create Note </Button>
        <NoteDialog
          isDialogOpen={isDialogOpen}
          onOpenChange2={onOpenChangeDialog}
          note={selectedNote}
          title={selectedNote ? 'Edit Note' : 'Create Note'}
        />
        {/* {!isFetching && <DataTable columns={gridColumns({ onDelete, onEdit })} data={notes.data} />} */}
      </div>
    </section>
  )
}

export default Note

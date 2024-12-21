import { Button } from '@/components/ui/button'
import { useState } from 'react'
import DataTable from '../../../components/dataTable/dataTable'
import NoteDialog from '../components/dialog'
import gridColumns from '../components/gridColumns'
import useGetNotes from '../hooks/useGetNotes'
import useDeleteNoteMutation from '../hooks/useDeleteNoteMutation'

const Note = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedNote, setSelectedNote] = useState(null)
  const useDeleteMutation = useDeleteNoteMutation()

  const { data: notes, isFetching } = useGetNotes()

  const onDelete = selectedRow => useDeleteMutation.mutate(selectedRow.id)

  const onEdit = selectedRow => {
    setSelectedNote(selectedRow)
    setIsDialogOpen(true)
  }

  const onOpenChangeDialog = value => {
    setIsDialogOpen(value)
    if (!value) {
      setSelectedNote(null)
    }
  }

  return (
    <section className='py-16'>
      <div className='container'>
        <h1 className='text-3xl font-bold'>Notes</h1>
        <Button onClick={() => setIsDialogOpen(true)}> Create Note </Button>
        <NoteDialog
          isDialogOpen={isDialogOpen}
          onOpenChange={onOpenChangeDialog}
          note={selectedNote}
          title='Create Note'
        />
        {/* {!isFetching && <DataTable columns={gridColumns({ onDelete, onEdit })} data={notes.data} />} */}
      </div>
    </section>
  )
}

export default Note

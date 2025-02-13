import { BackDashBoard } from '@/components/backDash/BackDashBoard'
import { Spinner } from '@/components/loader/Spinner'
import { useTranslation } from 'react-i18next'
import { useState, useMemo } from 'react'
import {
  useGetAllNotesQuery,
  useGetAllNotesColumnsQuery,
  useCreateNoteMutation,
  useUpdateNoteColumIdMutation,
  useUpdateNoteByIdMutation,
  useDeleteNoteByIdMutation
} from '../slice/notesSlice'
import {
  NotesSearchBar,
  NotesColumn,
  NotesCreateDialog
} from '../components/index'
import { StatusColumn, NotesColor } from '../utils/index'
import AlertDialogComponent from '@/components/alertDialog/AlertDialog'

export default function Notes() {
  const { t } = useTranslation()
  const [searchTerm, setSearchTerm] = useState('')
  const [openAlertDialog, setOpenAlertDialog] = useState(false) //alert dialog open/close
  const [alertProps, setAlertProps] = useState({})

  const {
    data: dataColumns = { data: [] },
    isError: isErrorColumns,
    isLoading: isLoadingColumns,
    isFetching: isFetchingColumns,
    isSuccess: isSuccessColumns,
    error: errorColumns
  } = useGetAllNotesColumnsQuery()

  const {
    data: dataNotes = { data: [] },
    isError: isErrorNotes,
    isLoading: isLoadingNotes,
    isFetching: isFetchingNotes,
    isSuccess: isSuccessNotes,
    error: errorNotes
  } = useGetAllNotesQuery()

  const [
    createNote,
    { isLoading: isLoadingPost, isError: isErrorPost, isSuccess: isSuccessPost }
  ] = useCreateNoteMutation()

  const [
    updateNoteColumId,
    { isLoading: isLoadingPut, isError: isErrorPut, isSuccess: isSuccessPut }
  ] = useUpdateNoteColumIdMutation()

  const [
    updateNoteById,
    {
      isLoading: isLoadingPutCard,
      isError: isErrorPutCard,
      isSuccess: isSuccessPutCard
    }
  ] = useUpdateNoteByIdMutation()

  const [
    deleteNoteById,
    {
      isLoading: isLoadingDelete,
      isError: isErrorDelete,
      isSuccess: isSuccessDelete
    }
  ] = useDeleteNoteByIdMutation()

  const filteredColumns = useMemo(() => {
    if (!searchTerm) return dataNotes?.data

    return dataNotes?.data.map(column => ({
      ...column,
      notes: column.notes.filter(note => {
        const searchTermLower = searchTerm.toLowerCase()
        return (
          note.title.toLowerCase().includes(searchTermLower) ||
          note.content.toLowerCase().includes(searchTermLower)
        )
      })
    }))
  }, [dataNotes, searchTerm])

  const setColor = code => {
    return code === StatusColumn.MEDIUM
      ? NotesColor.YELLOW
      : code === StatusColumn.HIGH
        ? NotesColor.RED
        : NotesColor.GREEN
  }

  const handleDragStart = (e, noteId, sourceColumnCode) => {
    e.dataTransfer.setData(
      'application/json',
      JSON.stringify({ noteId, sourceColumnCode })
    )
  }

  const handleDragOver = e => {
    e.preventDefault()
  }

  const handleDrop = async (e, targetColumnCode) => {
    e.preventDefault()

    const data = JSON.parse(e.dataTransfer.getData('application/json'))
    const { noteId, sourceColumnCode } = data

    if (sourceColumnCode === targetColumnCode) return

    const newColor = setColor(targetColumnCode)

    const sourceColumn = dataNotes?.data.find(
      col => col.code === sourceColumnCode
    )
    const targetColumn = dataNotes?.data.find(
      col => col.code === targetColumnCode
    )
    const noteToMove = sourceColumn?.notes.find(note => note.id === noteId)

    if (!noteToMove) return dataNotes?.data

    await updateNoteColumId({
      id: noteToMove.id,
      columnId: targetColumn.id,
      color: newColor
    }).unwrap()
  }

  const handleSearch = term => {
    setSearchTerm(term)
  }

  const handleCreateNote = async ({ title, content, status }) => {
    const color = setColor(status.code)

    const newNote = await createNote({
      title,
      content,
      color,
      columnId: status.id
    }).unwrap()

    setOpenAlertDialog(true)
    setAlertProps({
      alertTitle: t('add_record'),
      alertMessage: t('added_successfully'),
      cancel: false,
      success: true,
      onSuccess: () => {},
      variantSuccess: 'info'
    })
  }

  const handleDeleteNote = async noteId => {
    await deleteNoteById(noteId).unwrap()
  }

  const handleEditNote = async note => {
    const { id, content, title } = note
    await updateNoteById({
      id: id,
      body: {
        content,
        title
      }
    }).unwrap()
  }
  return (
    <>
      <BackDashBoard link={'/home'} moduleName={t('notes')} />
      <div className='relative w-full px-4'>
        {/* Show spinner when loading or fetching */}
        {(isLoadingColumns ||
          isLoadingNotes ||
          isLoadingPut ||
          isLoadingPost ||
          isLoadingDelete ||
          isLoadingPutCard ||
          isFetchingColumns ||
          isFetchingNotes) && <Spinner />}
        <div className='w-full space-y-6'>
          <div className='flex flex-wrap items-center justify-between gap-4'>
            <NotesCreateDialog
              onCreateNote={handleCreateNote}
              dataStatus={dataColumns?.data}
            />
            <NotesSearchBar onSearch={handleSearch} />
          </div>
          <div className='flex flex-col md:flex-row gap-6 p-4 min-h-[700px] w-full'>
            {filteredColumns.map(column => (
              <NotesColumn
                key={column.id}
                column={column}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onDeleteNote={handleDeleteNote}
                onEditNote={handleEditNote}
              />
            ))}
          </div>
          <AlertDialogComponent
            openAlertDialog={openAlertDialog}
            setOpenAlertDialog={setOpenAlertDialog}
            alertProps={alertProps}
          />
        </div>
      </div>
    </>
  )
}

import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
// import { useSelector } from 'react-redux'
import {
  useGetAllNotesQuery,
  useGetAllNotesColumnsQuery,
  useCreateNoteMutation,
  useUpdateNoteColumIdMutation,
  useUpdateNoteByIdMutation
} from '../slice/notesSlice'
import { NotesSearchBar, NotesColumn, NotesCreateDialog } from './index'
import { StatusColumn, NotesColor } from '../utils/index'
import AlertDialogComponent from '@/components/alertDialog/AlertDialog'

const initialColumns = [
  {
    id: 'col1',
    title: 'Por Hacer',
    notes: [
      {
        id: '1',
        title: 'Reunión de equipo',
        content: 'Discutir los objetivos del próximo trimestre',
        color: 'green',
        columnId: 'col1'
      },
      {
        id: '2',
        title: 'Proyecto React',
        content: 'Implementar nueva funcionalidad de drag and drop',
        color: 'green',
        columnId: 'col1'
      }
    ]
  },
  {
    id: 'col2',
    title: 'En Progreso',
    notes: [
      {
        id: '3',
        title: 'Diseño UI',
        content: 'Crear mockups para la nueva interfaz',
        color: 'yellow',
        columnId: 'col2'
      }
    ]
  },
  {
    id: 'col3',
    title: 'Completado',
    notes: [
      {
        id: '4',
        title: 'Setup inicial',
        content: 'Configuración del proyecto y dependencias',
        color: 'red',
        columnId: 'col3'
      }
    ]
  }
]

export function NotesGrid() {
  const { t } = useTranslation()
  const [columns, setColumns] = useState(initialColumns)
  const [searchTerm, setSearchTerm] = useState('')
  const [openAlertDialog, setOpenAlertDialog] = useState(false) //alert dialog open/close
  const [alertProps, setAlertProps] = useState({})

  const {
    data: dataColumns,
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

  const handleDeleteNote = noteId => {
    setColumns(prevColumns =>
      prevColumns.map(column => ({
        ...column,
        notes: column.notes.filter(note => note.id !== noteId)
      }))
    )
  }

  const handleEditNote = (noteId, title, content) => {
    // setColumns(prevColumns =>
    //   prevColumns.map(column => ({
    //     ...column,
    //     notes: column.notes.map(note =>
    //       note.id === noteId ? { ...note, title, content } : note
    //     )
    //   }))
    // )
  }

  return (
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
  )
}

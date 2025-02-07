import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
// import { useSelector } from 'react-redux'
import {
  useGetAllNotesQuery,
  useGetAllNotesColumnsQuery,
  useCreateNoteMutation
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
    error: errorNotes,
    refetch
  } = useGetAllNotesQuery()

  const [
    createNote,
    { isLoading: isLoadingPost, isError: isErrorPost, isSuccess: isSuccessPos }
  ] = useCreateNoteMutation()

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

  const handleDragStart = (e, noteId, sourceColumnId) => {
    e.dataTransfer.setData(
      'application/json',
      JSON.stringify({ noteId, sourceColumnId })
    )
  }

  const handleDragOver = e => {
    e.preventDefault()
  }

  const handleDrop = (e, targetColumnId) => {
    e.preventDefault()

    const data = JSON.parse(e.dataTransfer.getData('application/json'))
    const { noteId, sourceColumnId } = data

    if (sourceColumnId === targetColumnId) return

    setColumns(prevColumns => {
      const sourceColumn = prevColumns.find(col => col.id === sourceColumnId)
      const noteToMove = sourceColumn?.notes.find(note => note.id === noteId)

      if (!noteToMove) return prevColumns

      const newColor =
        status.code === StatusColumn.MEDIUM
          ? NotesColor.YELLOW
          : status.code === StatusColumn.HIGH
            ? NotesColor.RED
            : NotesColor.GREEN

      return prevColumns.map(column => {
        if (column.id === sourceColumnId) {
          return {
            ...column,
            notes: column.notes.filter(note => note.id !== noteId)
          }
        }
        if (column.id === targetColumnId) {
          return {
            ...column,
            notes: [
              ...column.notes,
              { ...noteToMove, columnId: targetColumnId, color: newColor }
            ]
          }
        }
        return column
      })
    })
  }

  const handleSearch = term => {
    setSearchTerm(term)
  }

  const handleCreateNote = async ({ title, content, status }) => {
    const color =
      status.code === StatusColumn.MEDIUM
        ? NotesColor.YELLOW
        : status.code === StatusColumn.HIGH
          ? NotesColor.RED
          : NotesColor.GREEN

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
    // setColumns(prevColumns => {
    //   return prevColumns.map(column => {
    //     if (column.id === columnId) {
    //       return {
    //         ...column,
    //         notes: [newNote, ...column.notes]
    //       }
    //     }
    //     return column
    //   })
    // })
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
    setColumns(prevColumns =>
      prevColumns.map(column => ({
        ...column,
        notes: column.notes.map(note =>
          note.id === noteId ? { ...note, title, content } : note
        )
      }))
    )
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

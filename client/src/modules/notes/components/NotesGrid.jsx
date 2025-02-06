import { useState, useMemo } from 'react'
import { NotesSearchBar, NotesColumn, NotesCreateDialog } from './index'

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
  const [columns, setColumns] = useState(initialColumns)
  const [searchTerm, setSearchTerm] = useState('')

  const filteredColumns = useMemo(() => {
    if (!searchTerm) return columns

    return columns.map(column => ({
      ...column,
      notes: column.notes.filter(note => {
        const searchTermLower = searchTerm.toLowerCase()
        return (
          note.title.toLowerCase().includes(searchTermLower) ||
          note.content.toLowerCase().includes(searchTermLower)
        )
      })
    }))
  }, [columns, searchTerm])

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

      let newColor = 'green'
      if (targetColumnId === 'col2') newColor = 'yellow'
      if (targetColumnId === 'col3') newColor = 'red'

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

  const handleCreateNote = (title, content, columnId) => {
    let color = 'green'
    if (columnId === 'col2') color = 'yellow'
    if (columnId === 'col3') color = 'redd'

    setColumns(prevColumns => {
      const newNote = {
        id: Date.now().toString(),
        title,
        content,
        color,
        columnId
      }

      return prevColumns.map(column => {
        if (column.id === columnId) {
          return {
            ...column,
            notes: [newNote, ...column.notes]
          }
        }
        return column
      })
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
        <NotesCreateDialog onCreateNote={handleCreateNote} />
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
    </div>
  )
}

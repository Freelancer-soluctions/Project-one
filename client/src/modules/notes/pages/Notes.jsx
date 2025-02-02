import { NotesGrid } from '../components/NotesGrid'

export default function NotesPage() {
  return (
    <div className='w-full px-4 py-8'>
      <h1 className='mb-8 text-3xl font-bold text-center'>
        Sistema de Gestión de Tareas
      </h1>
      <NotesGrid />
    </div>
  )
}

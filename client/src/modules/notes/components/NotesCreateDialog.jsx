import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { LuPlusCircle } from 'react-icons/lu'
import { useState } from 'react'

export function NotesCreateDialog({ onCreateNote }) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')

  const handleSubmit = e => {
    e.preventDefault()
    if (title.trim() && content.trim()) {
      onCreateNote(title, content)
      setTitle('')
      setContent('')
      setOpen(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className='gap-2'>
          <LuPlusCircle className='w-5 h-5' />
          Crear Nota
        </Button>
      </DialogTrigger>
      <DialogContent className='sm:max-w-[425px]'>
        <DialogHeader>
          <DialogTitle>Crear Nueva Nota</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className='mt-4 space-y-4'>
          <div className='space-y-2'>
            <Label htmlFor='title'>Título</Label>
            <Input
              id='title'
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder='Ingresa el título de la nota'
              required
            />
          </div>
          <div className='space-y-2'>
            <Label htmlFor='content'>Contenido</Label>
            <Textarea
              id='content'
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder='Ingresa el contenido de la nota'
              required
            />
          </div>
          <Button type='submit' className='w-full'>
            Crear Nota
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

'use client'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useState, useEffect } from 'react' // Added React import

export function NotesEditDialog({
  open,
  onOpenChange,
  onEditNote,
  noteId,
  initialTitle,
  initialContent
}) {
  const [title, setTitle] = useState(initialTitle)
  const [content, setContent] = useState(initialContent)

  useEffect(() => {
    setTitle(initialTitle)
    setContent(initialContent)
  }, [initialTitle, initialContent])

  const handleSubmit = e => {
    e.preventDefault()
    if (title.trim() && content.trim()) {
      onEditNote(noteId, title, content)
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[425px]'>
        <DialogHeader>
          <DialogTitle>Editar Nota</DialogTitle>
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
            Guardar Cambios
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

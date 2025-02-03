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
import { useTranslation } from 'react-i18next'
import PropTypes from 'prop-types'

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
  const { t } = useTranslation()
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
          <DialogTitle>{t('edit_note')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className='mt-4 space-y-4'>
          <div className='space-y-2'>
            <Label htmlFor='title'>{t('title')}</Label>
            <Input
              id='title'
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder={t('title_placeholder')}
              required
            />
          </div>
          <div className='space-y-2'>
            <Label htmlFor='content'>{t('content')}</Label>
            <Textarea
              id='content'
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder={t('content_placeholder')}
              required
            />
          </div>
          <Button type='submit' variant='info' className='w-full'>
            {t('save')}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

NotesEditDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onOpenChange: PropTypes.func.isRequired,
  onEditNote: PropTypes.func.isRequired,
  noteId: PropTypes.number,
  initialTitle: PropTypes.string,
  initialContent: PropTypes.string
}

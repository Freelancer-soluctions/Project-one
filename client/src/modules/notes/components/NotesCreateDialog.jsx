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
import { useTranslation } from 'react-i18next'
import PropTypes from 'prop-types'

export function NotesCreateDialog({ onCreateNote }) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const { t } = useTranslation()

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
        <Button className='gap-2' variant='success'>
          {t('create_note')}
          <LuPlusCircle className='w-5 h-5 ml-auto opacity-50' />
        </Button>
      </DialogTrigger>
      <DialogContent className='sm:max-w-[425px]'>
        <DialogHeader>
          <DialogTitle>{t('create_note')}</DialogTitle>
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

NotesCreateDialog.propTypes = {
  onCreateNote: PropTypes.func.isRequired
}

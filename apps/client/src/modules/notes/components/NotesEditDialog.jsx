import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useTranslation } from 'react-i18next'
import PropTypes from 'prop-types'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { CgNotes } from 'react-icons/cg'
import { notesEditDialogSchema } from '../utils/index'

export function NotesEditDialog({ open, onOpenChange, onEditNote, note }) {
  const { t } = useTranslation()

  // Configura el formulario
  const formEditNotesDialog = useForm({
    resolver: zodResolver(notesEditDialogSchema),
    defaultValues: {
      ...note
    }
  })
  const onEditSubmitDialog = values => {
    if (values.title.trim() && values.content.trim()) {
      onEditNote(values)
      onOpenChange(false)
      formEditNotesDialog.reset()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[425px]'>
        <DialogHeader>
          <DialogTitle>
            <CgNotes className='inline mr-3 w-7 h-7' />
            {t('edit_note')}
          </DialogTitle>
        </DialogHeader>
        <Form {...formEditNotesDialog}>
          <form
            method='post'
            action=''
            id='notes-edit-form'
            noValidate
            onSubmit={formEditNotesDialog.handleSubmit(onEditSubmitDialog)}
            className='mt-4 space-y-4'>
            <div className='space-y-2'>
              <FormField
                control={formEditNotesDialog.control}
                name='title'
                render={({ field }) => {
                  return (
                    <FormItem className='flex flex-col flex-auto col-span-1'>
                      <FormLabel htmlFor='title'>{t('title')}*</FormLabel>
                      <FormControl>
                        <Input
                          id='title'
                          {...field} // ✅ Enlazar con react-hook-form
                          placeholder={t('title_placeholder')}
                          required
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )
                }}
              />
            </div>
            <div className='space-y-2'>
              <FormField
                control={formEditNotesDialog.control}
                name='content'
                render={({ field }) => {
                  return (
                    <FormItem className='flex flex-col flex-auto col-span-1'>
                      <FormLabel htmlFor='content'>{t('content')}*</FormLabel>
                      <FormControl>
                        <Textarea
                          id='content'
                          {...field} // ✅ Enlazar con react-hook-form
                          placeholder={t('content_placeholder')}
                          required
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )
                }}
              />
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type='button' variant='secondary'>
                  {t('close')}
                </Button>
              </DialogClose>

              <Button type='submit' variant='info'>
                {t('save')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

NotesEditDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onOpenChange: PropTypes.func.isRequired,
  onEditNote: PropTypes.func.isRequired,
  note: PropTypes.object.isRequired
}

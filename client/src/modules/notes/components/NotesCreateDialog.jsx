import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { useTranslation } from 'react-i18next'
import { CgNotes } from 'react-icons/cg'
import PropTypes from 'prop-types'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { NotesCreateDialogSchema } from '../utils/index'

export function NotesCreateDialog({ onCreateNote, dataStatus, open, setOpen }) {
  const { t } = useTranslation()

  // Configura el formulario
  const formNotesDialog = useForm({
    resolver: zodResolver(NotesCreateDialogSchema),
    defaultValues: {
      title: '',
      content: ''
    }
  })

  const onSubmitDialog = values => {
    console.log('onSubmit', values)
    if (values.title.trim() && values.content.trim() && values.status) {
      onCreateNote(values)
      setOpen(false)
      formNotesDialog.reset()
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={isOpen => {
        if (!isOpen) {
          formNotesDialog.reset() // Resetea el formulario cuando se cierra
          setOpen(false)
        }
        setOpen(isOpen)
      }}>
      {/* <DialogTrigger asChild>
        <Button className='gap-2' variant='success'>
          {t('create_note')}
          <LuPlus className='w-5 h-5 ml-auto opacity-50' />
        </Button>
      </DialogTrigger> */}
      <DialogContent className='sm:max-w-[425px]'>
        <DialogHeader>
          <DialogTitle>
            <CgNotes className='inline mr-3 w-7 h-7' />
            {t('create_note')}
          </DialogTitle>
        </DialogHeader>

        <Form {...formNotesDialog}>
          <form
            method='post'
            action=''
            id='notes-form'
            noValidate
            onSubmit={formNotesDialog.handleSubmit(onSubmitDialog)}
            className='mt-4 space-y-4'>
            <div className='space-y-2'>
              <FormField
                control={formNotesDialog.control}
                name='status'
                render={({ field }) => {
                  return (
                    <FormItem className='flex flex-col flex-auto'>
                      <FormLabel htmlFor='status'>{t('status')}</FormLabel>
                      <Select
                        onValueChange={code => {
                          // Buscar el objeto completo por el `code`
                          const selectedStatus = dataStatus.find(
                            item => item.code === code
                          )
                          if (selectedStatus) {
                            field.onChange(selectedStatus) // Asignar el objeto completo
                          }
                        }}
                        value={field.value?.code}
                        // defaultValue={field.value} // Se asegura de que tome el valor inicial del form
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={t('select_status')} />
                        </SelectTrigger>
                        <SelectContent>
                          {dataStatus.map(col => (
                            <SelectItem key={col.id} value={col.code}>
                              {col.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )
                }}
              />
            </div>
            <div className='space-y-2'>
              <FormField
                control={formNotesDialog.control}
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
                control={formNotesDialog.control}
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

NotesCreateDialog.propTypes = {
  onCreateNote: PropTypes.func.isRequired,
  dataStatus: PropTypes.array.isRequired
}

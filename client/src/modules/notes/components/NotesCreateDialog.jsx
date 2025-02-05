import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
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
import { LuPlusCircle } from 'react-icons/lu'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import PropTypes from 'prop-types'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useGetAllNotesColumnsQuery } from '../slice/notesSlice'
import { notesDialogSchema, StatusColumn } from '../utils/index'

export function NotesCreateDialog({ onCreateNote }) {
  const {
    data: dataColumns,
    isError: isErrorColumns,
    isLoading: isLoadingColumns,
    isFetching: isFetchingColumns,
    isSuccess: isSuccessColumns,
    error: errorColumns
  } = useGetAllNotesColumnsQuery()
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [selectedCode, setSelectedCode] = useState()

  const { t } = useTranslation()

  useEffect(() => {
    if (dataColumns?.data.length > 0) {
      // Buscar la primera columna que tenga el código "TODO" por defecto
      const defaultColumn = dataColumns.data.find(
        col => col.code === StatusColumn.LOW
      )
      // Si existe, usar su código; si no, tomar el primer código disponible
      setSelectedCode(defaultColumn?.code || null)
      // Obtener el título de la opción seleccionada
    }
  }, [dataColumns])

  const selectedColumn = dataColumns?.data.find(
    col => col.code === selectedCode
  )

  // Configura el formulario
  const formDialog = useForm({
    resolver: zodResolver(notesDialogSchema),
    defaultValues: {
      id: '',
      title: '',
      content: '',
      color: '',
      createdBy: '',
      createdOn: '',
      userNoteCreated: ''
    }
  })

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

        <Form {...formDialog}>
          <form
            method='post'
            action=''
            id='profile-info-form'
            noValidate
            onSubmit={formDialog.handleSubmit(handleSubmit)}
            className='mt-4 space-y-4'>
            <div className='space-y-2'>
              <FormField
                control={formDialog.control}
                name='status'
                render={({ field }) => {
                  return (
                    <FormItem className='flex flex-col flex-auto'>
                      <FormLabel htmlFor='status'>{t('status')}*</FormLabel>
                      <Select
                        value={selectedCode}
                        onValueChange={setSelectedCode}>
                        <SelectTrigger>
                          <SelectValue>
                            {selectedColumn?.title || t('select_status')}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {dataColumns?.data.map(col => (
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
                control={formDialog.control}
                name='title'
                render={({ field }) => {
                  return (
                    <FormItem className='flex flex-col flex-auto col-span-1'>
                      <FormLabel htmlFor='title'>{t('title')}*</FormLabel>
                      <FormControl>
                        <Input
                          id='title'
                          value={title}
                          onChange={e => setTitle(e.target.value)}
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
                control={formDialog.control}
                name='content'
                render={({ field }) => {
                  return (
                    <FormItem className='flex flex-col flex-auto col-span-1'>
                      <FormLabel htmlFor='content'>{t('content')}*</FormLabel>
                      <FormControl>
                        <Textarea
                          id='content'
                          value={content}
                          onChange={e => setContent(e.target.value)}
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
            <Button type='submit' variant='info' className='w-full'>
              {t('save')}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

NotesCreateDialog.propTypes = {
  onCreateNote: PropTypes.func.isRequired
}

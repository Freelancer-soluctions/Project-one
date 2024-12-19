import { QueryClient, useMutation } from '@tanstack/react-query'
import { postMethod } from '@/services/axiosService'
import { useToast } from '@/components/ui/use-toast'

const url = 'note'
const config = {
  headers: { 'content-type': 'multipart/form-data' }
}

interface Note {
  id: number | string;
  [key: string]: any; // Puedes especificar otros campos según la estructura de tus notas
}

const useCreateNoteMutation = (onOpenChange: { (): void; (arg0: boolean): void }) => {
  const queryClient = new QueryClient()

  const { toast } = useToast()

  const onMutate = async (variables: Iterable<readonly [PropertyKey, any]>) => {
    await queryClient.cancelQueries({ queryKey: ['notes'] })
    const optimisticNote:Note = { id: Date.now(), ...Object.fromEntries(variables) }
    queryClient.setQueryData<Note[]>(['notes'], oldData => {
      console.log(oldData, 'ojito')
      return oldData ? [...oldData, optimisticNote] : [optimisticNote]
    })
    return { optimisticNote }
  }

  const onCreateSuccess = (result: { data: any }, variables: any, context: { optimisticNote: { id: any } }) => {
    const { data: createdNote } = result
    console.log(createdNote, context.optimisticNote.id)
    queryClient.setQueryData<Note[]>(['notes'], oldData => {
      console.log(oldData, 'oldData')
      if (!oldData) return [createdNote]
      return oldData.map((note: { id: any }) => {
        console.log(note, 'notemap')
        return note.id === context.optimisticNote.id ? createdNote : note
      })
    })
    toast({
      description: 'Note was created successfully.'
    })
    onOpenChange(false)
  }

  const onRequestError = (error: any, _variables: any, context: { optimisticNote: { id: any } }) => {
    queryClient.setQueryData<unknown>(['notes'], (oldData: any[]) =>
      oldData.filter((note: { id: any }) => note.id !== context.optimisticNote.id)
    )

    toast({
      variant: 'destructive',
      title: 'Uh oh! Something went wrong.',
      description: 'There was a problem with your request.'
    })
  }

  return useMutation({
    mutationFn: newNote => postMethod({ url, body: newNote, config }),
    onMutate,
    onSuccess: onCreateSuccess,
    // Arreglar
    // onError: onRequestError
  })
}

export default useCreateNoteMutation

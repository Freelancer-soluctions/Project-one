import { QueryClient, useMutation } from '@tanstack/react-query'
import { postMethod } from '@/services/axiosService'
import { useToast } from '@/components/ui/use-toast'

const url = 'note'
const config = {
  headers: { 'content-type': 'multipart/form-data' }
}
const useCreateNoteMutation = onOpenChange => {
  const queryClient = new QueryClient()

  const { toast } = useToast()

  const onMutate = async variables => {
    await queryClient.cancelQueries({ queryKey: ['notes'] })
    const optimisticNote = { id: Date.now(), ...Object.fromEntries(variables) }
    queryClient.setQueryData(['notes'], oldData => {
      console.log(oldData, 'ojito')
      return oldData ? [...oldData, optimisticNote] : [optimisticNote]
    })
    return { optimisticNote }
  }

  const onCreateSuccess = (result, variables, context) => {
    const { data: createdNote } = result
    console.log(createdNote, context.optimisticNote.id)
    queryClient.setQueryData(['notes'], oldData => {
      console.log(oldData, 'oldData')
      if (!oldData) return [createdNote]
      return oldData.map(note => {
        console.log(note, 'notemap')
        return note.id === context.optimisticNote.id ? createdNote : note
      })
    })
    toast({
      description: 'Note was created successfully.'
    })
    onOpenChange(false)
  }

  const onRequestError = (error, variables, context) => {
    queryClient.setQueryData(['notes'], oldData =>
      oldData.filter(note => note.id !== context.optimisticNote.id)
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
    onError: onRequestError
  })
}

export default useCreateNoteMutation

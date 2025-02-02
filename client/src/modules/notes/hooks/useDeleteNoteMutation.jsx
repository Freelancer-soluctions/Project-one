import { useMutation } from '@tanstack/react-query'
import { useToast } from '@/components/ui/use-toast'
import { deleteMethod } from '@/services/axiosService'

const url = 'note'

const useDeleteNoteMutation = () => {
  const { toast } = useToast()

  const onUpdateSuccess = () => {
    toast({
      description: 'Note was deleted successfully.'
    })
  }

  const onRequestError = () => {
    toast({
      variant: 'destructive',
      title: 'Uh oh! Something went wrong.',
      description: 'There was a problem with your request.'
    })
  }

  const deleteMutation = useMutation({
    mutationFn: id => deleteMethod({ url: `${url}/${id}` }),
    onSuccess: onUpdateSuccess,
    onError: onRequestError
  })
  return deleteMutation
}

export default useDeleteNoteMutation

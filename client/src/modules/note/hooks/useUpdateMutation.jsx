import { useMutation } from "@tanstack/react-query";
import { useToast } from '@/components/ui/use-toast';
import { putMethod } from "@/services/axiosService";


const url = 'note';
const config = {
    headers: { 'content-type': 'multipart/form-data' }
}
const useUpdateNoteMutation = (onOpenChange) => {
    const { toast } = useToast()

    const onUpdateSuccess =  () => {
        toast({
            description: 'Note was updated successfully.',
        });
        onOpenChange(false)
    }

    const onRequestError = () => {
        toast({
            variant: "destructive",
            title: "Uh oh! Something went wrong.",
            description: "There was a problem with your request.",
        })
    };


    const updateMutation = useMutation({
        mutationFn: (updatedNote) => {
            const { formValues, id } = updatedNote;
            return putMethod({ url: `${url}/${id}`, body: formValues, config });
        },
        onSuccess: onUpdateSuccess,
        onError: onRequestError,
    });
    return updateMutation;

}

export default useUpdateNoteMutation;
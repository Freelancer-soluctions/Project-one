import { useQuery } from '@tanstack/react-query';

import { getMethod } from "@/services/axiosService"

const url = 'note';

const useGetNotes = () => {

     const query = useQuery({
          queryKey: ['notes'],
          queryFn:  () => getMethod(url),
          initialData: [],
     })
     return query;

}

export default useGetNotes;
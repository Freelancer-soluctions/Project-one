/* React-specific entry point that automatically generates
   hooks corresponding to the defined endpoints */
import {createApi } from '@reduxjs/toolkit/query/react'
import {axiosPrivateBaseQuery} from '@/config/axios'


// Define a service using a base URL and expected endpoints
const notesApi = createApi({
    reducerPath:'notesApi',
    baseQuery:axiosPrivateBaseQuery({ baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1' }),
    endpoints: (builder) => ({
        getAllNotes: builder.query({
          query: (args) =>({
            url: `/notes`,
            method: "GET",
            params: {...args}
          }),
        }),
        getAllNotesColumns: builder.query({
          query: () =>({
            url: `/notes/notesColumns`,
            method: "GET",
          }),
        }),
        //   query: ({id, data }) =>({
        // updateNewById: builder.mutation({
        //     url: `/notes/${id}`,
        //     method: "PUT",
        //     body:{...data }
        //   })
        // }),
        createNote: builder.mutation({
          query(body) {
            return {
              url: `/notes/`,
              method: 'POST',
              body,
            }
          },
     
        }),
        // deleteNewById: builder.mutation({ 
        //   query(id) {
        //   return {
        //     url: `/notes/${id}`,
        //     method: 'DELETE',
        //   }
        // },})
       
      }),
    
})

// Export hooks for usage in functional components, which are
// auto-generated based on the defined endpoints
export const { useLazyGetAllNotesQuery, useGetAllNotesColumnsQuery, useCreateNotesMutation  } = notesApi

export default notesApi

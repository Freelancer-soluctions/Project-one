/* React-specific entry point that automatically generates
   hooks corresponding to the defined endpoints */
import {createApi } from '@reduxjs/toolkit/query/react'
import {axiosPrivateBaseQuery} from '@/config/axios'


// Define a service using a base URL and expected endpoints
const notesApi = createApi({
    reducerPath:'notesApi',
    baseQuery:axiosPrivateBaseQuery({ baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1' }),
    tagTypes: ['Notes'], // Agrega un tag identificador
    endpoints: (builder) => ({
        getAllNotes: builder.query({
          query: (args) =>({
            url: `/notes`,
            method: "GET",
            params: {...args}
          }),
          providesTags: ['Notes'], // Indica que este endpoint usa el tag 'Notes'
        }),
        getAllNotesColumns: builder.query({
          query: () =>({
            url: `/notes/notesColumns`,
            method: "GET",
          }),
        }),
        updateNoteColumId: builder.mutation({
          query: ( body ) =>({
            url: `/notes/noteColumn`,
            method: "PUT",
            body
          }),
          invalidatesTags: ['Notes'], // Invalida el cache de 'Notes' para volver a consultar
        }),
        updateNoteById: builder.mutation({
          query: ({id, body }) =>({
            url: `/news/${id}`,
            method: "PUT",
            body
          }),
          invalidatesTags: ['Notes'], // Invalida el cache de 'Notes' para volver a consultar
        }),
        createNote: builder.mutation({
          query: (body) => ({
            url: `/notes/`,
            method: 'POST',
            body,
          }),
          invalidatesTags: ['Notes'], // Invalida el cache de 'Notes' para volver a consultar
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
export const { useGetAllNotesQuery, useGetAllNotesColumnsQuery, useCreateNoteMutation, useUpdateNoteColumIdMutation, useUpdateNoteByIdMutation  } = notesApi

export default notesApi

/* React-specific entry point that automatically generates
   hooks corresponding to the defined endpoints */
import {createApi } from '@reduxjs/toolkit/query/react'
import {axiosPrivateBaseQuery} from '@/config/axios'


// Define a service using a base URL and expected endpoints
const eventsApi = createApi({
    reducerPath:'eventsApi',
    baseQuery:axiosPrivateBaseQuery({ baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1' }),
    tagTypes: ['Events'], // Agrega un tag identificador
    endpoints: (builder) => ({
        getAllEvents: builder.query({
          query: (searchQuery) =>({
            url: `/events`,
            method: "GET",
            params: {searchQuery}
          }),
          providesTags: ['Events'], // Indica que este endpoint usa el tag 'Notes'
        }),
        getAllEventTypes: builder.query({
          query: () =>({
            url: `/events/eventTypes`,
            method: "GET",
          }),
        }),
        // updateNoteColumId: builder.mutation({
        //   query: ( body ) =>({
        //     url: `/events/noteColumn`,
        //     method: "PUT",
        //     body
        //   }),
        //   invalidatesTags: ['Notes'], // Invalida el cache de 'Events' para volver a consultar
        // }),
        // updateNoteById: builder.mutation({
        //   query: ({id, body }) =>({
        //     url: `/events/${id}`,
        //     method: "PUT",
        //     body
        //   }),
        //   invalidatesTags: ['Notes'], // Invalida el cache de 'Events' para volver a consultar
        // }),
        createEvent: builder.mutation({
          query: (body) => ({
            url: `/events/`,
            method: 'POST',
            body,
          }),
          invalidatesTags: ['Events'], // Invalida el cache de 'Events' para volver a consultar
        }),
        // deleteNoteById: builder.mutation({ 
        //   query(id) {
        //   return {
        //     url: `/events/${id}`,
        //     method: 'DELETE',
        //   }
        // },
        // invalidatesTags: ['Notes'], // Invalida el cache de 'Notes' para volver a consultar
        // })
       
      }),
    
})

// Export hooks for usage in functional components, which are
// auto-generated based on the defined endpoints
export const {useGetAllEventsQuery,  useCreateEventMutation, useGetAllEventTypesQuery  } = eventsApi

export default eventsApi
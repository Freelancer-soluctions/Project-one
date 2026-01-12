/* React-specific entry point that automatically generates
   hooks corresponding to the defined endpoints */
import {createApi } from '@reduxjs/toolkit/query/react'
import {axiosPrivateBaseQuery} from '@/config/axios'


// Define a service using a base URL and expected endpoints
const newsApi = createApi({
    reducerPath:'newsApi',
    baseQuery:axiosPrivateBaseQuery({ baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1' }),
    tagTypes: ['News'], // Agrega un tag identificador
    endpoints: (builder) => ({
        getAllNews: builder.query({
          query: (args) =>({
            url: `/news`,
            method: "GET",
            params: {...args}
          }),
          providesTags: ['News'], // Indica que este endpoint usa el tag 'Notes'

        }),
        getAllNewsStatus: builder.query({
          query: () =>({
            url: `/news/status`,
            method: "GET",
          }),
        }),
        updateNewById: builder.mutation({
          query: ({id, data }) =>({
            url: `/news/${id}`,
            method: "PUT",
            body:{...data }
          }),
          invalidatesTags: ['News'], // Invalida el cache de 'Notes' para volver a consultar

        }),
        createNew: builder.mutation({
          query(body) {
            return {
              url: `/news/`,
              method: 'POST',
              body,
            }
          },
          invalidatesTags: ['News'], // Invalida el cache de 'Notes' para volver a consultar

        }),
        deleteNewById: builder.mutation({ 
          query(id) {
          return {
            url: `/news/${id}`,
            method: 'DELETE',
          }
        },
        invalidatesTags: ['News'], // Invalida el cache de 'Notes' para volver a consultar

      })
       
      }),
    
})

// Export hooks for usage in functional components, which are
// auto-generated based on the defined endpoints
export const { useLazyGetAllNewsQuery, useGetAllNewsStatusQuery, useUpdateNewByIdMutation, useCreateNewMutation, useDeleteNewByIdMutation } = newsApi

export default newsApi

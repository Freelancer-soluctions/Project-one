/* React-specific entry point that automatically generates
   hooks corresponding to the defined endpoints */
import { createApi } from '@reduxjs/toolkit/query/react'
import { axiosPrivateBaseQuery } from '@/config/axios'

// Define a service using a base URL and expected endpoints
const providersApi = createApi({
  reducerPath: 'providersApi',
  baseQuery: axiosPrivateBaseQuery({
    baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1'
  }),
  tagTypes: ['Providers'], // Agrega un tag identificador
  endpoints: builder => ({
    getAllProviders: builder.query({
      query: params => ({
        url: `/providers`,
        params
      }),
      providesTags: ['Providers'] // Indica que este endpoint usa el tag 'Notes'
    }),

    getAllProvidersFilters: builder.query({
      query: params => ({
        url: `/providers/providerFilters`,
        params
      }),
      providesTags: ['Providers'] // Indica que este endpoint usa el tag 'Notes'
    }),
    deleteProviderById: builder.mutation({
      query: id => ({
        url: `/providers/${id}`,
        method: 'DELETE'
      }),
      invalidatesTags: ['Providers'] // Invalida el cache de 'Notes' para volver a consultar
    }),
    createProvider: builder.mutation({
      query: data => ({
        url: `/providers/`,
        method: 'POST',
        body: data
      }),
      invalidatesTags: ['Providers'] // Invalida el cache de 'Notes' para volver a consultar
    }),
    updateProviderById: builder.mutation({
      query: ({ id, data }) => ({
        url: `/providers/${id}`,
        method: 'PUT',
        body: data
      }),
      invalidatesTags: ['Providers'] // Invalida el cache de 'Notes' para volver a consultar
    })
  })
})

// Export hooks for usage in functional components, which are
// auto-generated based on the defined endpoints
export const {
  useLazyGetAllProvidersQuery,
  useGetAllProvidersQuery,
  useGetAllProvidersFiltersQuery,
  useUpdateProviderByIdMutation,
  useCreateProviderMutation,
  useDeleteProviderByIdMutation
} = providersApi

export default providersApi

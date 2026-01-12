/* React-specific entry point that automatically generates
   hooks corresponding to the defined endpoints */
import { createApi } from '@reduxjs/toolkit/query/react'
import { axiosPrivateBaseQuery } from '@/config/axios'

// Define a service using a base URL and expected endpoints
const providerOrderApi = createApi({
  reducerPath: 'providerOrderApi',
  baseQuery: axiosPrivateBaseQuery({
    baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1'
  }),
  tagTypes: ['ProviderOrders'], // Agrega un tag identificador
  keepUnusedDataFor: 300, // 5 minutos
  endpoints: builder => ({
    getAllProviderOrders: builder.query({
      query: params => ({
        url: `/providerOrder`,
        method: 'GET',
        params
      }),
      providesTags: ['ProviderOrders'] // Indica que este endpoint usa el tag 'Notes'
    }),

    deleteProviderOrderById: builder.mutation({
      query: id => ({
        url: `/providerOrder/${id}`,
        method: 'DELETE'
      }),
      invalidatesTags: ['ProviderOrders'] // Invalida el cache de 'Notes' para volver a consultar
    }),
    createProviderOrder: builder.mutation({
      query: data => ({
        url: `/providerOrder/`,
        method: 'POST',
        body: data
      }),
      invalidatesTags: ['ProviderOrders'] // Invalida el cache de 'Notes' para volver a consultar
    }),
    updateProviderOrderById: builder.mutation({
      query: ({ id, data }) => ({
        url: `/providerOrder/${id}`,
        method: 'PUT',
        body: data
      }),
      invalidatesTags: ['ProviderOrders'] // Invalida el cache de 'Notes' para volver a consultar
    })
    // Cache selectivo
    //providesTags: (result) =>
    //result
    //? [
    //    ...result.map(({ id }) => ({ type: 'Warehouses', id })),
    //    { type: 'Warehouses', id: 'LIST' }
    //]
  })
})

// Export hooks for usage in functional components, which are
// auto-generated based on the defined endpoints
export const {
  useLazyGetAllProviderOrdersQuery,
  useGetAllProviderOrdersQuery,
  useUpdateProviderOrderByIdMutation,
  useCreateProviderOrderMutation,
  useDeleteProviderOrderByIdMutation
} = providerOrderApi

export default providerOrderApi

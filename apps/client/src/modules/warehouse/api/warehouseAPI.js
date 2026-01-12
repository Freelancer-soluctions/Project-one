/* React-specific entry point that automatically generates
   hooks corresponding to the defined endpoints */
import { createApi } from '@reduxjs/toolkit/query/react'
import { axiosPrivateBaseQuery } from '@/config/axios'

// Define a service using a base URL and expected endpoints
const warehouseApi = createApi({
  reducerPath: 'warehouseApi',
  baseQuery: axiosPrivateBaseQuery({
    baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1'
  }),
  tagTypes: ['Warehouses'], // Agrega un tag identificador
  keepUnusedDataFor: 300, // 5 minutos
  endpoints: builder => ({
    getAllWarehouses: builder.query({
      query: params => ({
        url: `/warehouse`,
        params
      }),
      providesTags: ['Warehouses'] // Indica que este endpoint usa el tag 'Notes'
    }),

    getAllWarehousesFilters: builder.query({
      query: () => ({
        url: `/warehouse/warehouseFilters`
      }),
      providesTags: ['Warehouses'] // Indica que este endpoint usa el tag 'Notes'
    }),

    deleteWarehouseById: builder.mutation({
      query: id => ({
        url: `/warehouse/${id}`,
        method: 'DELETE'
      }),
      invalidatesTags: ['Warehouses'] // Invalida el cache de 'Notes' para volver a consultar
    }),
    createWarehouse: builder.mutation({
      query: data => ({
        url: `/warehouse/`,
        method: 'POST',
        body: data
      }),
      invalidatesTags: ['Warehouses'] // Invalida el cache de 'Notes' para volver a consultar
    }),
    updateWarehouseById: builder.mutation({
      query: ({ id, data }) => ({
        url: `/warehouse/${id}`,
        method: 'PUT',
        body: data
      }),
      invalidatesTags: ['Warehouses'] // Invalida el cache de 'Notes' para volver a consultar
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
  useLazyGetAllWarehousesQuery,
  useGetAllWarehousesQuery,
  useGetAllWarehousesFiltersQuery,
  useUpdateWarehouseByIdMutation,
  useCreateWarehouseMutation,
  useDeleteWarehouseByIdMutation
} = warehouseApi

export default warehouseApi

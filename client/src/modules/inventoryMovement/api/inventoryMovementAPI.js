import { createApi } from '@reduxjs/toolkit/query/react'
import { axiosBaseQuery } from '@/lib/axios'

export const inventoryMovementAPI = createApi({
  reducerPath: 'inventoryMovementAPI',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['InventoryMovement'],
  endpoints: builder => ({
    getAllInventoryMovements: builder.query({
      query: () => ({
        url: '/v1/inventory-movements',
        method: 'GET'
      }),
      providesTags: ['InventoryMovement']
    }),
    createInventoryMovement: builder.mutation({
      query: data => ({
        url: '/v1/inventory-movements',
        method: 'POST',
        data
      }),
      invalidatesTags: ['InventoryMovement']
    }),
    updateInventoryMovementById: builder.mutation({
      query: ({ id, data }) => ({
        url: `/v1/inventory-movements/${id}`,
        method: 'PUT',
        data
      }),
      invalidatesTags: ['InventoryMovement']
    }),
    deleteInventoryMovementById: builder.mutation({
      query: id => ({
        url: `/v1/inventory-movements/${id}`,
        method: 'DELETE'
      }),
      invalidatesTags: ['InventoryMovement']
    })
  })
})

export const {
  useGetAllInventoryMovementsQuery,
  useCreateInventoryMovementMutation,
  useUpdateInventoryMovementByIdMutation,
  useDeleteInventoryMovementByIdMutation
} = inventoryMovementAPI 
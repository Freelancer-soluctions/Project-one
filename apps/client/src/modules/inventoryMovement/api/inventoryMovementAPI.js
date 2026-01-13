import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosPrivateBaseQuery } from '@/config/axios';

export const inventoryMovementAPI = createApi({
  reducerPath: 'inventoryMovementAPI',
  baseQuery: axiosPrivateBaseQuery({
    baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1',
  }),
  tagTypes: ['InventoryMovement'],
  endpoints: (builder) => ({
    getAllInventoryMovements: builder.query({
      query: () => ({
        url: '/inventory-movements',
        method: 'GET',
      }),
      providesTags: ['InventoryMovement'],
    }),
    createInventoryMovement: builder.mutation({
      query: (data) => ({
        url: '/inventory-movements',
        method: 'POST',
        data,
      }),
      invalidatesTags: ['InventoryMovement'],
    }),
    updateInventoryMovementById: builder.mutation({
      query: ({ id, data }) => ({
        url: `/inventory-movements/${id}`,
        method: 'PUT',
        data,
      }),
      invalidatesTags: ['InventoryMovement'],
    }),
    deleteInventoryMovementById: builder.mutation({
      query: (id) => ({
        url: `/inventory-movements/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['InventoryMovement'],
    }),
  }),
});

export const {
  useLazyGetAllInventoryMovementsQuery,
  useCreateInventoryMovementMutation,
  useUpdateInventoryMovementByIdMutation,
  useDeleteInventoryMovementByIdMutation,
} = inventoryMovementAPI;

export default inventoryMovementAPI;

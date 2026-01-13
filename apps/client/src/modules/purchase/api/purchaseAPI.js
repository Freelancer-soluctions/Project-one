/* React-specific entry point that automatically generates
   hooks corresponding to the defined endpoints */
import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosPrivateBaseQuery } from '@/config/axios';

// Define a service using a base URL and expected endpoints
const purchaseApi = createApi({
  reducerPath: 'purchaseApi',
  baseQuery: axiosPrivateBaseQuery({
    baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1',
  }),
  tagTypes: ['Purchases'],
  keepUnusedDataFor: 300, // 5 minutos
  endpoints: (builder) => ({
    getAllPurchases: builder.query({
      query: (params) => ({
        url: `/purchases`,
        params,
      }),
      providesTags: ['Purchases'],
    }),

    deletePurchaseById: builder.mutation({
      query: (id) => ({
        url: `/purchases/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Purchases'],
    }),
    createPurchase: builder.mutation({
      query: (data) => ({
        url: `/purchases/`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Purchases'],
    }),
    updatePurchaseById: builder.mutation({
      query: ({ id, data }) => ({
        url: `/purchases/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Purchases'],
    }),
  }),
});

// Export hooks for usage in functional components, which are
// auto-generated based on the defined endpoints
export const {
  useLazyGetAllPurchasesQuery,
  useUpdatePurchaseByIdMutation,
  useCreatePurchaseMutation,
  useDeletePurchaseByIdMutation,
} = purchaseApi;

export default purchaseApi;

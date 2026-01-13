/* React-specific entry point that automatically generates
   hooks corresponding to the defined endpoints */
import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosPrivateBaseQuery } from '@/config/axios';

// Define a service using a base URL and expected endpoints
const salesApi = createApi({
  reducerPath: 'salesApi',
  baseQuery: axiosPrivateBaseQuery({
    baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1',
  }),
  tagTypes: ['Sales'],
  keepUnusedDataFor: 300, // 5 minutos
  endpoints: (builder) => ({
    getAllSales: builder.query({
      query: (params) => ({
        url: `/sales`,
        params,
      }),
      providesTags: ['Sales'],
    }),

    deleteSaleById: builder.mutation({
      query: (id) => ({
        url: `/sales/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Sales'],
    }),
    createSale: builder.mutation({
      query: (data) => ({
        url: `/sales/`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Sales'],
    }),
    updateSaleById: builder.mutation({
      query: ({ id, data }) => ({
        url: `/sales/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Sales'],
    }),
  }),
});

// Export hooks for usage in functional components, which are
// auto-generated based on the defined endpoints
export const {
  useLazyGetAllSalesQuery,
  useUpdateSaleByIdMutation,
  useCreateSaleMutation,
  useDeleteSaleByIdMutation,
} = salesApi;

export default salesApi;

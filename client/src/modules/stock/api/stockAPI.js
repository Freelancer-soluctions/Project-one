import { createApi } from '@reduxjs/toolkit/query/react'
import { axiosPrivateBaseQuery } from '@/config/axios'

// Define a service using a base URL and expected endpoints
const stockApi = createApi({
  reducerPath: 'stockApi',
  baseQuery: axiosPrivateBaseQuery({
    baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1'
  }),
  tagTypes: ['Stock'],
  endpoints: builder => ({
    getAllStock: builder.query({
      query: params => ({
        url: `/stock`,
        method:'GET',
        params
      }),
      providesTags: ['Stock']
    }),

    deleteStockById: builder.mutation({
      query: id => ({
        url: `/stock/${id}`,
        method: 'DELETE'
      }),
      invalidatesTags: ['Stock']
    }),

    createStock: builder.mutation({
      query: data => ({
        url: `/stock/`,
        method: 'POST',
        body: data
      }),
      invalidatesTags: ['Stock']
    }),

    updateStockById: builder.mutation({
      query: ({ id, data }) => ({
        url: `/stock/${id}`,
        method: 'PUT',
        body: data
      }),
      invalidatesTags: ['Stock']
    }),

    getStockAlerts: builder.query({
      query: () => ({
        url: `/stock/alerts`
      }),
      providesTags: ['Stock']
    }),

    getStockByProductId:builder.mutation({
      query: id => ({
        url: `/stock/${id}`,
        method: 'GET',
      }),
      providesTags: ['Stock']
    }),
  })
})

// Export hooks for usage in functional components
export const {
  useLazyGetAllStockQuery,
  useUpdateStockByIdMutation,
  useCreateStockMutation,
  useDeleteStockByIdMutation,
  useGetStockAlertsQuery
} = stockApi

export default stockApi 
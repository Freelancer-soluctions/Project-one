/* React-specific entry point that automatically generates
hooks corresponding to the defined endpoints */
import { createApi } from '@reduxjs/toolkit/query/react'
import { axiosPrivateBaseQuery } from '@/config/axios'

// Define a service using a base URL and expected endpoints
const performanceEvaluationApi = createApi({
  reducerPath: 'performanceEvaluationApi',
  baseQuery: axiosPrivateBaseQuery({ baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1' }),
  tagTypes: ['PerformanceEvaluation'],
  keepUnusedDataFor: 300, // 5 minutos
  endpoints: (builder) => ({
    getAllPerformanceEvaluations: builder.query({
      query: (params) => ({
        url: '/performance-evaluation', // Adjust endpoint URL if needed
        params
      }),
      providesTags: ['PerformanceEvaluation'],
    }),

    deletePerformanceEvaluationById: builder.mutation({
      query: (id) => ({
        url: `/performance-evaluation/${id}`,
        method: 'DELETE'
      }),
      invalidatesTags: ['PerformanceEvaluation'],
    }),

    createPerformanceEvaluation: builder.mutation({
      query: (data) => ({
        url: '/performance-evaluation',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['PerformanceEvaluation'],
    }),

    updatePerformanceEvaluationById: builder.mutation({
      query: ({ id, data }) => ({
        url: `/performance-evaluation/${id}`,
        method: 'PUT',
        body: data
      }),
      invalidatesTags: ['PerformanceEvaluation'],
    }),
  })
})

// Export hooks for usage in functional components
export const {
  useLazyGetAllPerformanceEvaluationsQuery,
  useGetAllPerformanceEvaluationsQuery,
  useUpdatePerformanceEvaluationByIdMutation,
  useCreatePerformanceEvaluationMutation,
  useDeletePerformanceEvaluationByIdMutation
} = performanceEvaluationApi

export default performanceEvaluationApi 
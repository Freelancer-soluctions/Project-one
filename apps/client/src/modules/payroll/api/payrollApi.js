/* React-specific entry point that automatically generates
hooks corresponding to the defined endpoints */
import { createApi } from '@reduxjs/toolkit/query/react'
import { axiosPrivateBaseQuery } from '@/config/axios'

// Define a service using a base URL and expected endpoints
const payrollApi = createApi({
  reducerPath: 'payrollApi',
  baseQuery: axiosPrivateBaseQuery({
    baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1'
  }),
  tagTypes: ['Payroll'],
  keepUnusedDataFor: 300, // 5 minutos
  endpoints: builder => ({
    getAllPayroll: builder.query({
      query: params => ({
        url: '/payroll',
        params
      }),
      providesTags: ['Payroll']
    }),

    deletePayrollById: builder.mutation({
      query: id => ({
        url: `/payroll/${id}`,
        method: 'DELETE'
      }),
      invalidatesTags: ['Payroll']
    }),

    createPayroll: builder.mutation({
      query: data => ({
        url: '/payroll',
        method: 'POST',
        body: data
      }),
      invalidatesTags: ['Payroll']
    }),

    updatePayrollById: builder.mutation({
      query: ({ id, data }) => ({
        url: `/payroll/${id}`,
        method: 'PUT',
        body: data
      }),
      invalidatesTags: ['Payroll']
    })
  })
})

// Export hooks for usage in functional components
export const {
  useLazyGetAllPayrollQuery,
  useGetAllPayrollQuery,
  useUpdatePayrollByIdMutation,
  useCreatePayrollMutation,
  useDeletePayrollByIdMutation
} = payrollApi

export default payrollApi

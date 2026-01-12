/* React-specific entry point that automatically generates
hooks corresponding to the defined endpoints */
import { createApi } from '@reduxjs/toolkit/query/react'
import { axiosPrivateBaseQuery } from '@/config/axios'

// Define a service using a base URL and expected endpoints
const vacationApi = createApi({
  reducerPath: 'vacationApi',
  baseQuery: axiosPrivateBaseQuery({ baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1' }),
  tagTypes: ['Vacation'],
  keepUnusedDataFor: 300, // 5 minutos
  endpoints: (builder) => ({
    getAllVacations: builder.query({
      query: (params) => ({
        url: '/vacation', // Check endpoint if different
        params
      }),
      providesTags: ['Vacation'],
    }),

    deleteVacationById: builder.mutation({
      query: (id) => ({
        url: `/vacation/${id}`,
        method: 'DELETE'
      }),
      invalidatesTags: ['Vacation'],
    }),

    createVacation: builder.mutation({
      query: (data) => ({
        url: '/vacation',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Vacation'],
    }),

    updateVacationById: builder.mutation({
      query: ({ id, data }) => ({
        url: `/vacation/${id}`,
        method: 'PUT',
        body: data
      }),
      invalidatesTags: ['Vacation'],
    }),
  })
})

// Export hooks for usage in functional components
export const {
  useLazyGetAllVacationsQuery,
  useGetAllVacationsQuery,
  useUpdateVacationByIdMutation,
  useCreateVacationMutation,
  useDeleteVacationByIdMutation
} = vacationApi

export default vacationApi 
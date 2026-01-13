/* React-specific entry point that automatically generates
hooks corresponding to the defined endpoints */
import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosPrivateBaseQuery } from '@/config/axios';

// Define a service using a base URL and expected endpoints
const attendanceApi = createApi({
  reducerPath: 'attendanceApi',
  baseQuery: axiosPrivateBaseQuery({
    baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1',
  }),
  tagTypes: ['Attendance'],
  keepUnusedDataFor: 300, // 5 minutos
  endpoints: (builder) => ({
    getAllAttendance: builder.query({
      query: (params) => ({
        url: '/attendance',
        params,
      }),
      providesTags: ['Attendance'],
    }),

    deleteAttendanceById: builder.mutation({
      query: (id) => ({
        url: `/attendance/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Attendance'],
    }),

    createAttendance: builder.mutation({
      query: (data) => ({
        url: '/attendance',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Attendance'],
    }),

    updateAttendanceById: builder.mutation({
      query: ({ id, data }) => ({
        url: `/attendance/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Attendance'],
    }),
  }),
});

// Export hooks for usage in functional components
export const {
  useLazyGetAllAttendanceQuery,
  useGetAllAttendanceQuery,
  useUpdateAttendanceByIdMutation,
  useCreateAttendanceMutation,
  useDeleteAttendanceByIdMutation,
} = attendanceApi;

export default attendanceApi;

/* React-specific entry point that automatically generates
hooks corresponding to the defined endpoints */
import { createApi } from '@reduxjs/toolkit/query/react'
import { axiosPrivateBaseQuery } from '@/config/axios'

// Define a service using a base URL and expected endpoints
const permissionApi = createApi({
  reducerPath: 'permissionApi',
  baseQuery: axiosPrivateBaseQuery({
    baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1'
  }),
  tagTypes: ['Permission'],
  keepUnusedDataFor: 300, // 5 minutos
  endpoints: builder => ({
    getAllPermissions: builder.query({
      query: params => ({
        url: '/permission',
        params
      }),
      providesTags: ['Permission']
    }),

    deletePermissionById: builder.mutation({
      query: id => ({
        url: `/permission/${id}`,
        method: 'DELETE'
      }),
      invalidatesTags: ['Permission']
    }),

    createPermission: builder.mutation({
      query: data => ({
        url: '/permission',
        method: 'POST',
        body: data
      }),
      invalidatesTags: ['Permission']
    }),

    updatePermissionById: builder.mutation({
      query: ({ id, data }) => ({
        url: `/permission/${id}`,
        method: 'PUT',
        body: data
      }),
      invalidatesTags: ['Permission']
    })
  })
})

// Export hooks for usage in functional components
export const {
  useLazyGetAllPermissionsQuery,
  useGetAllPermissionsQuery,
  useUpdatePermissionByIdMutation,
  useCreatePermissionMutation,
  useDeletePermissionByIdMutation
} = permissionApi

export default permissionApi

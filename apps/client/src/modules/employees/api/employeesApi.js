/* React-specific entry point that automatically generates
   hooks corresponding to the defined endpoints */
import { createApi } from '@reduxjs/toolkit/query/react'
import { axiosPrivateBaseQuery } from '@/config/axios'

// Define a service using a base URL and expected endpoints
const employeesApi = createApi({
  reducerPath: 'employeesApi',
  baseQuery: axiosPrivateBaseQuery({
    baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1'
  }),
  tagTypes: ['Employees'], // Agrega un tag identificador
  keepUnusedDataFor: 300, // 5 minutos
  endpoints: builder => ({
    getAllEmployees: builder.query({
      query: params => ({
        url: `/employees`,
        params
      }),
      providesTags: ['Employees'] // Indica que este endpoint usa el tag 'Employees'
    }),

    getAllEmployeesFilters: builder.query({
      query: () => ({
        url: `/employees/employeeFilters`
      }),
      providesTags: ['Employees'] // Indica que este endpoint usa el tag 'Employees'
    }),

    deleteEmployeeById: builder.mutation({
      query: id => ({
        url: `/employees/${id}`,
        method: 'DELETE'
      }),
      invalidatesTags: ['Employees'] // Invalida el cache de 'Employees' para volver a consultar
    }),
    createEmployee: builder.mutation({
      query: data => ({
        url: `/employees/`,
        method: 'POST',
        body: data
      }),
      invalidatesTags: ['Employees'] // Invalida el cache de 'Employees' para volver a consultar
    }),
    updateEmployeeById: builder.mutation({
      query: ({ id, data }) => ({
        url: `/employees/${id}`,
        method: 'PUT',
        body: data
      }),
      invalidatesTags: ['Employees'] // Invalida el cache de 'Employees' para volver a consultar
    })
  })
})

// Export hooks for usage in functional components, which are
// auto-generated based on the defined endpoints
export const {
  useLazyGetAllEmployeesQuery,
  useGetAllEmployeesQuery,
  useGetAllEmployeesFiltersQuery,
  useUpdateEmployeeByIdMutation,
  useCreateEmployeeMutation,
  useDeleteEmployeeByIdMutation
} = employeesApi

export default employeesApi

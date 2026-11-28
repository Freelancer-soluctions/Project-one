/* React-specific entry point that automatically generates
   hooks corresponding to the defined endpoints */
import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosPrivateBaseQuery } from '@/config/axios';

/** Employee list + CRUD endpoints. */
const employeeEndpoints = (builder) => ({
  getAllEmployees: builder.query({
    query: (params) => ({
      url: `/employees`,
      params,
    }),
    providesTags: ['Employees'], // Indica que este endpoint usa el tag 'Employees'
  }),

  getAllEmployeesFilters: builder.query({
    query: () => ({
      url: `/employees/employeeFilters`,
    }),
    providesTags: ['Employees'], // Indica que este endpoint usa el tag 'Employees'
  }),

  deleteEmployeeById: builder.mutation({
    query: (id) => ({
      url: `/employees/${id}`,
      method: 'DELETE',
    }),
    invalidatesTags: ['Employees'], // Invalida el cache de 'Employees' para volver a consultar
  }),
  createEmployee: builder.mutation({
    query: (data) => ({
      url: `/employees/`,
      method: 'POST',
      body: data,
    }),
    invalidatesTags: ['Employees'], // Invalida el cache de 'Employees' para volver a consultar
  }),
  updateEmployeeById: builder.mutation({
    query: ({ id, data }) => ({
      url: `/employees/${id}`,
      method: 'PATCH',
      body: data,
    }),
    invalidatesTags: ['Employees'], // Invalida el cache de 'Employees' para volver a consultar
  }),
});

/**
 * Position/department catalog endpoints. Shared by the employee dialog,
 * the employee filters and the catalog admin page: every mutation
 * invalidates 'Employees' so the selects refresh.
 */
const catalogEndpoints = (builder) => ({
  getAllPositions: builder.query({
    query: (params) => ({
      url: `/positions`,
      params,
    }),
    providesTags: ['Employees'],
  }),

  getAllDepartments: builder.query({
    query: (params) => ({
      url: `/departments`,
      params,
    }),
    providesTags: ['Employees'],
  }),

  // Full, unpaginated {id,name} lists for the select inputs (the server caps
  // paginated lists at MAX_QUERY_LIMIT, which would hide catalog rows).
  getPositionOptions: builder.query({
    query: () => ({ url: `/positions/options` }),
    providesTags: ['Employees'],
  }),

  getDepartmentOptions: builder.query({
    query: () => ({ url: `/departments/options` }),
    providesTags: ['Employees'],
  }),

  createPosition: builder.mutation({
    query: (data) => ({
      url: `/positions/`,
      method: 'POST',
      body: data,
    }),
    invalidatesTags: ['Employees'],
  }),
  updatePositionById: builder.mutation({
    query: ({ id, data }) => ({
      url: `/positions/${id}`,
      method: 'PATCH',
      body: data,
    }),
    invalidatesTags: ['Employees'],
  }),
  deletePositionById: builder.mutation({
    query: (id) => ({
      url: `/positions/${id}`,
      method: 'DELETE',
    }),
    invalidatesTags: ['Employees'],
  }),

  createDepartment: builder.mutation({
    query: (data) => ({
      url: `/departments/`,
      method: 'POST',
      body: data,
    }),
    invalidatesTags: ['Employees'],
  }),
  updateDepartmentById: builder.mutation({
    query: ({ id, data }) => ({
      url: `/departments/${id}`,
      method: 'PATCH',
      body: data,
    }),
    invalidatesTags: ['Employees'],
  }),
  deleteDepartmentById: builder.mutation({
    query: (id) => ({
      url: `/departments/${id}`,
      method: 'DELETE',
    }),
    invalidatesTags: ['Employees'],
  }),
});

// Define a service using a base URL and expected endpoints
const employeesApi = createApi({
  reducerPath: 'employeesApi',
  baseQuery: axiosPrivateBaseQuery({
    baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1',
  }),
  tagTypes: ['Employees'], // Agrega un tag identificador
  keepUnusedDataFor: 300, // 5 minutos
  endpoints: (builder) => ({
    ...employeeEndpoints(builder),
    ...catalogEndpoints(builder),
  }),
});

// Export hooks for usage in functional components, which are
// auto-generated based on the defined endpoints
export const {
  useLazyGetAllEmployeesQuery,
  useGetAllEmployeesQuery,
  useGetAllEmployeesFiltersQuery,
  useGetAllPositionsQuery,
  useLazyGetAllPositionsQuery,
  useGetAllDepartmentsQuery,
  useLazyGetAllDepartmentsQuery,
  useGetPositionOptionsQuery,
  useGetDepartmentOptionsQuery,
  useCreatePositionMutation,
  useUpdatePositionByIdMutation,
  useDeletePositionByIdMutation,
  useCreateDepartmentMutation,
  useUpdateDepartmentByIdMutation,
  useDeleteDepartmentByIdMutation,
  useUpdateEmployeeByIdMutation,
  useCreateEmployeeMutation,
  useDeleteEmployeeByIdMutation,
} = employeesApi;

export default employeesApi;

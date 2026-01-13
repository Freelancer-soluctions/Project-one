/* React-specific entry point that automatically generates
   hooks corresponding to the defined endpoints */
import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosPrivateBaseQuery } from '@/config/axios'; // Assuming this path is correct

// Define a service using a base URL and expected endpoints
const expensesApi = createApi({
  reducerPath: 'expensesApi',
  baseQuery: axiosPrivateBaseQuery({
    baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1',
  }),
  tagTypes: ['Expenses'], //  tag identificador para Expenses
  keepUnusedDataFor: 300, // 5 minutos
  endpoints: (builder) => ({
    getAllExpenses: builder.query({
      query: (params) => ({
        url: `/expenses`, // Endpoint para Expenses
        method: 'GET',
        params,
      }),
      providesTags: ['Expenses'], // Indica que este endpoint usa el tag 'Expenses'
    }),

    deleteExpenseById: builder.mutation({
      query: (id) => ({
        url: `/expenses/${id}`, // Endpoint para Expenses
        method: 'DELETE',
      }),
      invalidatesTags: ['Expenses'], // Invalida el cache de 'Expenses'
    }),
    createExpense: builder.mutation({
      query: (data) => ({
        url: `/expenses`, // Endpoint para Expenses
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Expenses'], // Invalida el cache de 'Expenses'
    }),
    updateExpenseById: builder.mutation({
      query: ({ id, data }) => ({
        url: `/expenses/${id}`, // Endpoint para Expenses
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Expenses'], // Invalida el cache de 'Expenses'
    }),
    // Cache selectivo
    //providesTags: (result) =>
    //result
    //? [
    //    ...result.map(({ id }) => ({ type: 'Expenses', id })), // Cambiado a Expenses
    //    { type: 'Expenses', id: 'LIST' } // Cambiado a Expenses
    //]
  }),
});

// Export hooks for usage in functional components, which are
// auto-generated based on the defined endpoints
export const {
  useLazyGetAllExpensesQuery, // Hook para Expenses
  useGetAllExpensesQuery, // Hook para Expenses
  useUpdateExpenseByIdMutation, // Hook para Expenses
  useCreateExpenseMutation, // Hook para Expenses
  useDeleteExpenseByIdMutation, // Hook para Expenses
} = expensesApi;

export default expensesApi;

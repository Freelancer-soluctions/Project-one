/* React-specific entry point that automatically generates
   hooks corresponding to the defined endpoints */
   import {createApi} from '@reduxjs/toolkit/query/react'
   import {axiosPrivateBaseQuery} from '@/config/axios'
   
   
   // Define a service using a base URL and expected endpoints
   const clientOrderApi = createApi({
       reducerPath:'clientOrderApi',
       baseQuery:axiosPrivateBaseQuery({ baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1' }),
       tagTypes: ['ClientOrder'], // Agrega un tag identificador
       keepUnusedDataFor: 300, // 5 minutos
       endpoints: (builder) => ({
           getAllClientOrder: builder.query({
             query: (params) => ({
               url: `/clientOrder`,
               method: 'GET', 
               params
             }),
             providesTags: ['ClientOrder'], // Indica que este endpoint usa el tag 'Notes'
           }),
       
           deleteClientOrderById: builder.mutation({
             query: (id) => ({
               url: `/clientOrder/${id}`,
               method: 'DELETE'
             }),
             invalidatesTags: ['ClientOrder'], // Invalida el cache de 'Notes' para volver a consultar
           }),
           createClientOrder: builder.mutation({
             query: (data) => ({
               url: `/clientOrder/`,
               method: 'POST',
               body: data,
             }),
             invalidatesTags: ['ClientOrder'], // Invalida el cache de 'Notes' para volver a consultar
           }),
           updateClientOrderById: builder.mutation({
             query: ({ id, data }) => ({
               url: `/clientOrder/${id}`,
               method: 'PUT',
               body: data
             }),
             invalidatesTags: ['ClientOrder'], // Invalida el cache de 'Notes' para volver a consultar
           }),
            // Cache selectivo
            //providesTags: (result) =>
             //result
             //? [
             //    ...result.map(({ id }) => ({ type: 'Warehouses', id })),
             //    { type: 'Warehouses', id: 'LIST' }
             //]
         })
   })
   
   // Export hooks for usage in functional components, which are
   // auto-generated based on the defined endpoints
   export const { 
     useLazyGetAllClientOrderQuery,
     useGetAllClientOrderQuery,
     useUpdateClientOrderByIdMutation, 
     useCreateClientOrderMutation, 
     useDeleteClientOrderByIdMutation 
   } = clientOrderApi
   
   export default clientOrderApi
   
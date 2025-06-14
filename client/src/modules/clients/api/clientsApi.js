/* React-specific entry point that automatically generates
   hooks corresponding to the defined endpoints */
   import {createApi} from '@reduxjs/toolkit/query/react'
   import {axiosPrivateBaseQuery} from '@/config/axios'
   
   
   // Define a service using a base URL and expected endpoints
   const clientsApi = createApi({
       reducerPath:'clientsApi',
       baseQuery:axiosPrivateBaseQuery({ baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1' }),
       tagTypes: ['Clients'], // Agrega un tag identificador
       keepUnusedDataFor: 300, // 5 minutos
       endpoints: (builder) => ({
           getAllClients: builder.query({
             query: (params) => ({
               url: `/clients`,
               method: 'GET', 
               params
             }),
             providesTags: ['Clients'], // Indica que este endpoint usa el tag 'Notes'
           }),
       
           deleteClientById: builder.mutation({
             query: (id) => ({
               url: `/clients/${id}`,
               method: 'DELETE'
             }),
             invalidatesTags: ['Clients'], // Invalida el cache de 'Notes' para volver a consultar
           }),
           createClient: builder.mutation({
             query: (data) => ({
               url: `/clients/`,
               method: 'POST',
               body: data,
             }),
             invalidatesTags: ['Clients'], // Invalida el cache de 'Notes' para volver a consultar
           }),
           updateClientById: builder.mutation({
             query: ({ id, data }) => ({
               url: `/clients/${id}`,
               method: 'PUT',
               body: data
             }),
             invalidatesTags: ['Clients'], // Invalida el cache de 'Notes' para volver a consultar
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
     useLazyGetAllClientsQuery,
     useGetAllClientsQuery,
     useUpdateClientByIdMutation, 
     useCreateClientMutation, 
     useDeleteClientByIdMutation 
   } = clientsApi
   
   export default clientsApi
   
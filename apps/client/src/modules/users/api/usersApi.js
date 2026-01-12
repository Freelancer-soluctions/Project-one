/* React-specific entry point that automatically generates
   hooks corresponding to the defined endpoints */
   import {createApi} from '@reduxjs/toolkit/query/react'
   import {axiosPrivateBaseQuery} from '@/config/axios'
   
   
   // Define a service using a base URL and expected endpoints
   const usersApi = createApi({
       reducerPath:'usersApi',
       baseQuery:axiosPrivateBaseQuery({ baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1' }),
       tagTypes: ['Users'], // Agrega un tag identificador
       keepUnusedDataFor: 300, // 5 minutos
       endpoints: (builder) => ({
           getAllUsers: builder.query({
             query: (params) => ({
               url: `/users`,
               method: 'GET', 
               params
             }),
             providesTags: ['Users'], // Indica que este endpoint usa el tag 'Notes'
           }),
            getAllUsersStatus: builder.query({
             query: () => ({
               url: `/users/status`,
               method: 'GET', 
             }),
             providesTags: ['Users'], // Indica que este endpoint usa el tag 'Notes'
           }),
           getAllUsersRol: builder.query({
             query: () => ({
               url: `/users/roles`,
               method: 'GET', 
             }),
             providesTags: ['Users'], // Indica que este endpoint usa el tag 'Notes'
           }),
            getAllUserPermits: builder.query({
             query: () => ({
               url: `/users/permits`,
               method: 'GET', 
             }),
             providesTags: ['Users'], // Indica que este endpoint usa el tag 'Notes'
           }),
           deleteUserById: builder.mutation({
             query: (id) => ({
               url: `/users/${id}`,
               method: 'DELETE'
             }),
             invalidatesTags: ['Users'], // Invalida el cache de 'Notes' para volver a consultar
           }),
           createUser: builder.mutation({
             query: (data) => ({
               url: `/users/`,
               method: 'POST',
               body: data,
             }),
             invalidatesTags: ['Users'], // Invalida el cache de 'Notes' para volver a consultar
           }),
           updateUserById: builder.mutation({
             query: ({ id, data }) => ({
               url: `/users/${id}`,
               method: 'PUT',
               body: data
             }),
             invalidatesTags: ['Users'], // Invalida el cache de 'Notes' para volver a consultar
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
     useLazyGetAllUsersQuery,
     useGetAllUsersStatusQuery,
     useGetAllUsersRolQuery,
     useGetAllUserPermitsQuery,
     useUpdateUserByIdMutation, 
     useCreateUserMutation, 
     useDeleteUserByIdMutation 
   } = usersApi
   
   export default usersApi
   
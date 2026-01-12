/* React-specific entry point that automatically generates
   hooks corresponding to the defined endpoints */
   import {createApi } from '@reduxjs/toolkit/query/react'
   import {axiosPrivateBaseQuery} from '@/config/axios'
   
   // Define a service using a base URL and expected endpoints
   const settingsProductCategoriesApi = createApi({
       reducerPath:'settingsProductCategoriesApi',
       baseQuery:axiosPrivateBaseQuery({ baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1' }),
       tagTypes: ['SettingsProductCategories'], // Agrega un tag identificador
       endpoints: (builder) => ({
           getAllCategories: builder.query({
             query: (params) => ({
               url: `/settings/product/categories`,
               params
             }),
             providesTags: ['SettingsProductCategories'], // Indica que este endpoint usa el tag 'Categories'
           }),
       
           deleteCategoryById: builder.mutation({
             query: (id) => ({
               url: `/settings/product/categories/${id}`,
               method: 'DELETE'
             }),
             invalidatesTags: ['SettingsProductCategories'], // Invalida el cache de 'Categories' para volver a consultar
           }),
           createCategory: builder.mutation({
             query: (data) => ({
               url: `/settings/product/categories/`,
               method: 'POST',
               body: data,
             }),
             invalidatesTags: ['SettingsProductCategories'], // Invalida el cache de 'Categories' para volver a consultar
           }),
           updateCategoryById: builder.mutation({
             query: ({ id, data }) => ({
               url: `/settings/product/categories/${id}`,
               method: 'PUT',
               body: data
             }),
             invalidatesTags: ['SettingsProductCategories'], // Invalida el cache de 'Categories' para volver a consultar
           })
       })
   })
   
   // Export hooks for usage in functional components, which are
   // auto-generated based on the defined endpoints
   export const { 
     useLazyGetAllCategoriesQuery, 
     useUpdateCategoryByIdMutation, 
     useCreateCategoryMutation, 
     useDeleteCategoryByIdMutation 
   } = settingsProductCategoriesApi
   
   export default settingsProductCategoriesApi 
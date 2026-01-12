/* React-specific entry point that automatically generates
   hooks corresponding to the defined endpoints */
import { createApi } from '@reduxjs/toolkit/query/react'
import { axiosPrivateBaseQuery } from '@/config/axios'

// Define a service using a base URL and expected endpoints
const productsApi = createApi({
  reducerPath: 'productsApi',
  baseQuery: axiosPrivateBaseQuery({
    baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1'
  }),
  tagTypes: ['Products', 'ProductAttributes'], // Agrega un tag identificador
  endpoints: builder => ({
    getAllProducts: builder.query({
      query: args => ({
        url: `/products`,
        method: 'GET',
        params: { ...args }
      }),
      providesTags: ['Products'] // Indica que este endpoint usa el tag 'Notes'
    }),
    getAllProductsFilters: builder.query({
      query: () => ({
        url: `/products/productsFilters`,
        method: 'GET'
      }),
      providesTags: ['Products'] // Indica que este endpoint usa el tag 'Notes'
    }),
    getAllProductsStatus: builder.query({
      query: () => ({
        url: `/products/status`,
        method: 'GET'
      })
    }),
    getAllProductCategories: builder.query({
      query: () => ({
        url: `/products/category`,
        method: 'GET'
      })
    }),

    updateProductById: builder.mutation({
      query: ({ id, data }) => ({
        url: `/products/${id}`,
        method: 'PUT',
        body: { ...data }
      }),
      invalidatesTags: ['Products'] // Invalida el cache de 'Notes' para volver a consultar
    }),
    createProduct: builder.mutation({
      query(body) {
        return {
          url: `/products/`,
          method: 'POST',
          body
        }
      },
      invalidatesTags: ['Products'] // Invalida el cache de 'Notes' para volver a consultar
    }),
    deleteProductById: builder.mutation({
      query(id) {
        return {
          url: `/products/${id}`,
          method: 'DELETE'
        }
      },
      invalidatesTags: ['Products'] // Invalida el cache de 'Notes' para volver a consultar
    }),
    getAllProductAttributes: builder.query({
      query: id => ({
        url: `/products/attributes/${id}`,
        method: 'GET'
      })
      //providesTags: ['ProductAttributes'] // no funciona invalidar la cache ya que es un lazy
    }),
    deleteProductAttributeById: builder.mutation({
      query(id) {
        return {
          url: `/products/attributes/${id}`,
          method: 'DELETE'
        }
      },
      invalidatesTags: ['ProductAttributes'] // Invalida el cache de 'Notes' para volver a consultar
    }),
    saveProductAttributes: builder.mutation({
      query(body) {
        return {
          url: `/products/attributes/`,
          method: 'POST',
          body
        }
      },
      invalidatesTags: ['ProductAttributes'] // Invalida el cache de 'Notes' para volver a consultar
    })
  })
})

// Export hooks for usage in functional components, which are
// auto-generated based on the defined endpoints
export const {
  useLazyGetAllProductsQuery,
  useGetAllProductsStatusQuery,
  useGetAllProductsQuery,
  useGetAllProductsFiltersQuery,
  useGetAllProductCategoriesQuery,
  useLazyGetAllProductAttributesQuery,
  useUpdateProductByIdMutation,
  useCreateProductMutation,
  useDeleteProductByIdMutation,
  useDeleteProductAttributeByIdMutation,
  useSaveProductAttributesMutation
} = productsApi

export default productsApi

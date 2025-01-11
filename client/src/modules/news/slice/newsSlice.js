/* React-specific entry point that automatically generates
   hooks corresponding to the defined endpoints */
import {createApi } from '@reduxjs/toolkit/query/react'
import {axiosPrivateBaseQuery} from '@/config/axios'


// Define a service using a base URL and expected endpoints
const newsApi = createApi({
    reducerPath:'newsApi',
    baseQuery:axiosPrivateBaseQuery(),
    endpoints: (builder) => ({
        getAllNews: builder.query({
          query: (args) =>({
            url: `/news`,
            method: "GET",
            params: {...args}
          }),
        }),
        getAllNewsStatus: builder.query({
          query: () =>({
            url: `/news/status`,
            method: "GET",
          }),
        }),
        updateNewById: builder.mutation({
          query: ({id, ...data }) =>({
            url: `/news/${id}`,
            method: "PUT",
            body:{...data }
          })
        }),
        createNew: builder.mutation({
          query(body) {
            return {
              url: `/news/`,
              method: 'POST',
              body,
            }
          },
     
        }),
       
      }),
    
})

// Export hooks for usage in functional components, which are
// auto-generated based on the defined endpoints
export const { useLazyGetAllNewsQuery, useGetAllNewsStatusQuery, useUpdateNewByIdMutation, useCreateNewMutation } = newsApi

export default newsApi

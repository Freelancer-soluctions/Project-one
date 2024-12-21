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
      }),
    
})

// Export hooks for usage in functional components, which are
// auto-generated based on the defined endpoints
export const { useLazyGetAllNewsQuery, useGetAllNewsStatusQuery } = newsApi

export default newsApi

/* React-specific entry point that automatically generates
   hooks corresponding to the defined endpoints */
import {BaseQueryFn, createApi, FetchArgs } from '@reduxjs/toolkit/query/react'
import {axiosPrivateBaseQuery} from '@/config/axios'


interface GetAllNewsParams {
  limit?: number;
  page?: number;
  search?: string;
}

// Estructura de un objeto `News`
interface News {
  id: string;
  title: string;
  content: string;
}

// Respuesta para `getAllNews`
interface GetAllNewsResponse {
  data: News[];
  total: number;
}

// Estructura de un objeto `NewsStatus`
interface NewsStatus {
  id: string;
  status: string;
}

// Respuesta para `getAllNewsStatus`
interface GetAllNewsStatusResponse {
  statuses: NewsStatus[];
}

// Define a service using a base URL and expected endpoints
const newsApi = createApi({
    reducerPath:'newsApi',
    baseQuery:axiosPrivateBaseQuery()as BaseQueryFn<string | FetchArgs, unknown, unknown>,
    endpoints: (builder) => ({
        getAllNews: builder.query<GetAllNewsResponse, GetAllNewsParams>({
          query: (args:any) =>({
            url: `/news`,
            method: "GET",
            params: args
          }),
        }),
        getAllNewsStatus: builder.query<GetAllNewsStatusResponse, void>({
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

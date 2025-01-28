/* React-specific entry point that automatically generates
   hooks corresponding to the defined endpoints */
   import {createApi } from '@reduxjs/toolkit/query/react'
   import {axiosPrivateBaseQuery} from '@/config/axios'
   
   
   // Define a service using a base URL and expected endpoints
   const settingsApi = createApi({
       reducerPath:'settingsApi',
       baseQuery:axiosPrivateBaseQuery({ baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1' }),
       endpoints: (builder) => ({
           getSettingLanguageById: builder.query({
             query: ({id}) =>({
               url: `/language/${id}`,
               method: "GET",
              
             }),
           }),
           saveSettingLanguage: builder.mutation({
             query(body) {
               return {
                 url: `/language/`,
                 method: 'POST',
                 body,
               }
             },
        
           }),
     
          
         }),
       
   })
   
   // Export hooks for usage in functional components, which are
   // auto-generated based on the defined endpoints
   export const { useLazyGetSettingLanguageById, useSaveSettingLanguageMutation} = settingsApi
   
   export default settingsApi
   
/* React-specific entry point that automatically generates
   hooks corresponding to the defined endpoints */
   import {createApi } from '@reduxjs/toolkit/query/react'
   import {axiosPrivateBaseQuery} from '@/config/axios'
   
   
   // Define a service using a base URL and expected endpoints
   const settingsApi = createApi({
       reducerPath:'settingsApi',
       baseQuery:axiosPrivateBaseQuery({ baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1' }),
       keepUnusedDataFor: 0,
       endpoints: (builder) => ({
           getSettingLanguageById: builder.query({
             query: (id) =>({
               url: `/settings/language/${id}`,
               method: "GET",
              //  transformResponse: (response) => console.log("datasettings",response.data), // Extraer la data real
              //  keepUnusedDataFor: 1, // Cache por solo 5 segundos
              // keepUnusedDataFor: 0, // Cache por solo 0 segundos
             }),
               
           }),
           saveSettingLanguage: builder.mutation({
             query(body) {
               return {
                 url: `/settings/language/`,
                 method: 'POST',
                 body,
               }
             },
        
           }),
     
          
         }),
       
   })
   
   // Export hooks for usage in functional components, which are
   // auto-generated based on the defined endpoints
   export const { useLazyGetSettingLanguageByIdQuery , useSaveSettingLanguageMutation} = settingsApi
   
   export default settingsApi
   
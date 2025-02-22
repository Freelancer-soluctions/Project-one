// /* React-specific entry point that automatically generates
//    hooks corresponding to the defined endpoints */
//    import {createApi } from '@reduxjs/toolkit/query/react'
//    import {axiosPrivateBaseQuery} from '@/config/axios'
   
   
//    // Define a service using a base URL and expected endpoints
//    const settingsApi = createApi({
//        reducerPath:'settingsApi',
//        baseQuery:axiosPrivateBaseQuery({ baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1' }),
//        keepUnusedDataFor: 0,
//        endpoints: (builder) => ({
//            getSettingLanguageById: builder.query({
//              query: (id) =>({
//                url: `/settings/language/${id}`,
//                method: "GET",
//               //  transformResponse: (response) => console.log("datasettings",response.data), // Extraer la data real
//               //  keepUnusedDataFor: 1, // Cache por solo 5 segundos
//               // keepUnusedDataFor: 0, // Cache por solo 0 segundos
//              }),
//              refetchOnMount: false, // This disables caching

//            }),
//            saveSettingLanguage: builder.mutation({
//              query(body) {
//                return {
//                  url: `/settings/language/`,
//                  method: 'POST',
//                  body,
//                }
//              },
        
//            }),
     
          
//          }),
       
//    })
   
//    // Export hooks for usage in functional components, which are
//    // auto-generated based on the defined endpoints
//    export const { useGetSettingLanguageByIdQuery , useSaveSettingLanguageMutation} = settingsApi
   
//    export default settingsApi
   

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import {GetLanguageByUserIdFetch, SaveLanguage} from '@/modules/settings/api/settingsApi'

export const getLanguageByUserIdFetch = createAsyncThunk('settings/getLanguageByUserIdFetch', async (args, { rejectWithValue }) => {
  try {
    const response = await GetLanguageByUserIdFetch(args)
    return response.data
  } catch (error) {
    return rejectWithValue(error.response.data)
  }
})


export const saveSettingLanguageFetch = createAsyncThunk('settings/saveLanguage', async (args, { rejectWithValue }) => {
  try {
    const response = await SaveLanguage(args)
    return response.data
  } catch (error) {
    return rejectWithValue(error.response.data)
  }
})




const settingsSlice = createSlice({
  name: 'settings',
  initialState: {
    isLoading: false,
    dataSettings: {language:null},
    isError: false,
    errorMessage:''
  },
  // reducers: {
 
 
  // },
  extraReducers: (builder) => {
    // sign up
    builder.addCase(getLanguageByUserIdFetch.pending, (state, action) => {
      state.isLoading = true
      state.isError = false
    })
    builder.addCase(getLanguageByUserIdFetch.fulfilled, (state, action) => {
      state.isLoading = false
      state.isError = false
      state.dataSettings.language = action.payload 
    })
    builder.addCase(getLanguageByUserIdFetch.rejected, (state, action) => {
      console.log('Error', action.error.message)
      // console.log('Error payload', action.payload.error)
      state.isError = true
      state.isLoading = false
      state.errorMessage = action.error.message
    })

  }
})

// export const { } = settingsSlice.actions

export default settingsSlice.reducer

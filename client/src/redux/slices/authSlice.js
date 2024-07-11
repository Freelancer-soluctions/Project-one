import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { SignInApi } from '@/modules/auth/api/auth'
// export const origenSlice = createSlice({
//   name: 'unValor',
//   initialState: { miNombre: 'JAM' },
//   reducers: {
//     guardarMiNombre: (state, action) => {
//       state.miNombre = action.payload
//     }
//   }
// })

// export const { guardarMiNombre } = origenSlice.actions // Cuando se trabaja con slice se obtine actions que hace referencia a los reducers, pero estas son acciones
// pluginJsxRuntime
// // Extract the action creators object and the reducer
// const { actions, reducer } = postsSlice
// // Extract and export each action creator by name
// export const { createPost, updatePost, deletePost } = actions
// // Export the reducer, either as a default or named export
// export default reducer

import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

// Action
export const fetchTodos = createAsyncThunk('fetchTodos', async () => {
  const response = await fetch('https://jsonplaceholder.typicode.com/todos')
  return response.json()
})

export const signInFetch = createAsyncThunk('signInFetch', async (args, { rejectWithValue }) => {
  const response = await SignInApi(args)
  try {
  // console.log(response)
    return response.data
  } catch (error) {
    return rejectWithValue(error.response.data)
  }
})

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    isLoading: false,
    data: null,
    isError: false
  },
  extraReducers: (builder) => {
    builder.addCase(signInFetch.pending, (state, action) => {
      state.isLoading = true
    })
    builder.addCase(signInFetch.fulfilled, (state, action) => {
      state.isLoading = false
      state.data = action.payload
    })
    builder.addCase(signInFetch.rejected, (state, action) => {
      console.log('Error', action.error.message)
      state.isError = true
    })
  }
})

export default authSlice.reducer

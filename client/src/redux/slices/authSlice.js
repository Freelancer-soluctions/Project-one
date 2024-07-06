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

// Action
export const fetchTodos = createAsyncThunk('fetchTodos', async () => {
  const response = await fetch('https://jsonplaceholder.typicode.com/todos')
  return response.json()
})

export const signInFetch = createAsyncThunk('signInFetch', async (data) => {
  console.log('data', data)
  const response = await SignInApi(data)
  return response.json()
})

const authSlice = createSlice({
  name: 'todo',
  initialState: {
    isLoading: false,
    data: null,
    isError: false
  },
  extraReducers: (builder) => {
    builder.addCase(fetchTodos.pending, (state, action) => {
      state.isLoading = true
    })
    builder.addCase(fetchTodos.fulfilled, (state, action) => {
      state.isLoading = false
      state.data = action.payload
    })
    builder.addCase(fetchTodos.rejected, (state, action) => {
      console.log('Error', action.payload)
      state.isError = true
    })
  }
})

export default authSlice.reducer

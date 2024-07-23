import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { SignInApi, RefreshTokenApi, newsApi } from '@/modules/auth/api/auth'

// export const { guardarMiNombre } = origenSlice.actions // Cuando se trabaja con slice se obtine actions que hace referencia a los reducers, pero estas son acciones
// pluginJsxRuntime
// // Extract the action creators object and the reducer
// const { actions, reducer } = postsSlice
// // Extract and export each action creator by name
// export const { createPost, updatePost, deletePost } = actions
// // Export the reducer, either as a default or named export
// export default reducer

// Action
// export const fetchTodos = createAsyncThunk('fetchTodos', async () => {
//   const response = await fetch('https://jsonplaceholder.typicode.com/todos')
//   return response.json()
// })

// variation 1
export const signInFetch = createAsyncThunk('auth/signIn', async (args, { rejectWithValue }) => {
  try {
    const response = await SignInApi(args)
    return response.data
  } catch (error) {
    return rejectWithValue(error.response.data)
  }
})

export const newsFetch = createAsyncThunk('news', async (args, { rejectWithValue }) => {
  try {
    const response = await newsApi(args)
    return response.data
  } catch (error) {
    return rejectWithValue(error.response.data)
  }
})

export const refreshTokenFecth = createAsyncThunk('auth/refresh-token', async (args, { rejectWithValue }) => {
  try {
    const response = await RefreshTokenApi()
    return response.data
  } catch (error) {
    return rejectWithValue(error.response.data)
  }
})

// Variation 2
// export const signInFetch = createAsyncThunk('auth/signIn', async (_, { getState, rejectWithValue }) => {
//   try {
//     const state = getState()
//     console.log('hola state', state)
//     const res = await SignInApi({
//       username: state.auth.username,
//       password: state.auth.password
//     })

//     return res.data
//   } catch (error) {
//     return rejectWithValue(error.response.data)
//   }
// })

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    isLoading: false,
    user: null,
    isError: false
  },
  reducers: {
    updateAuthData (state, action) {
      state.user = action.payload
    }
  },
  extraReducers: (builder) => {
    // sign uo
    builder.addCase(signInFetch.pending, (state, action) => {
      state.isLoading = true
    })
    builder.addCase(signInFetch.fulfilled, (state, action) => {
      state.isLoading = false
      state.user = action.payload
    })
    builder.addCase(signInFetch.rejected, (state, action) => {
      console.log('Error', action.error.message)
      // console.log('Error payload', action.payload.error)
      state.isError = true
    })
    // refresh
    builder.addCase(refreshTokenFecth.pending, (state, action) => {
      state.isLoading = true
    })
    builder.addCase(refreshTokenFecth.fulfilled, (state, action) => {
      state.isLoading = false
      state.user.accessToken = action.payload.accessToken
    })
    builder.addCase(refreshTokenFecth.rejected, (state, action) => {
      console.log('Error', action.error.message)
      console.log('Error payload', action.payload.error)
      state.isError = true
    })
  }
})

export const { updateAuthData } = authSlice.actions

export default authSlice.reducer

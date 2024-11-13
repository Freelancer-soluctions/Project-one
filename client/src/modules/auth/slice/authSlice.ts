import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { SignInApi, RefreshTokenApi } from '@/modules/auth/api/auth'

interface SignInArgs {
  email: string
  password: string
}

interface User {
  error?: any
  accessToken: string
  // otros campos
}

interface AuthState {
  user: User | null
  isLoading: boolean
  isError: boolean
  isAuth: boolean
  errorMessage: string
}

// Tipos para la respuesta de SignInApi
interface SignInResponse {
  accessToken: string;
  error?: any;
  // otros campos de la respuesta
}

// Tipos para la respuesta de RefreshTokenApi
interface RefreshTokenResponse {
  accessToken: string
  data: {
    accessToken: string;
  };
}

const initialState: AuthState = {
  user: null,
  isLoading: false,
  isError: false,
  isAuth: false,
  errorMessage: '',
}

// Acción de login
export const signInFetch = createAsyncThunk<SignInResponse, SignInArgs>(
  'auth/signIn',
  async (args, { rejectWithValue }) => {
    try {
      const response = await SignInApi(args)
      return response.data // Asegúrate de que esta respuesta coincida con SignInResponse
    } catch (error: any) {
      return rejectWithValue(error.response?.data || error.message)
    }
  }
)

// Acción de refresh de token
export const refreshTokenFecth = createAsyncThunk<RefreshTokenResponse, void>(
  'auth/refresh-token',
  async (_, { rejectWithValue }) => {
    try {
      const response = await RefreshTokenApi()
      return response.data // Asegúrate de que esta respuesta coincida con RefreshTokenResponse
    } catch (error: any) {
      return rejectWithValue(error.response?.data || error.message)
    }
  }
)

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    updateAuthData(state, action) {
      state.user = action.payload
    },
  },
  extraReducers: (builder) => {
    builder.addCase(signInFetch.pending, (state) => {
      state.isLoading = true
      state.isError = false
      state.isAuth = false
    })
    builder.addCase(signInFetch.fulfilled, (state, action) => {
      state.isLoading = false
      state.isError = false
      state.isAuth = true
      state.user = {
        accessToken:action.payload.accessToken
      }
    })
    builder.addCase(signInFetch.rejected, (state, action) => {
      console.log('Error', action.error.message)
      state.isError = true
      state.isAuth = false
      state.isLoading = false
    })

    builder.addCase(refreshTokenFecth.pending, (state) => {
      state.isLoading = true
      state.isError = false
    })
    builder.addCase(refreshTokenFecth.fulfilled, (state, action) => {
      state.isLoading = false
      state.isError = false
      if (state.user) {
        state.user.accessToken = action.payload.accessToken
      }
      console.log('new-access-token store', action.payload.accessToken)
    })
    builder.addCase(refreshTokenFecth.rejected, (state, action) => {
      console.log('Error', action.error.message)
      state.isError = true
    })
  },
})

export const { updateAuthData } = authSlice.actions
export default authSlice.reducer

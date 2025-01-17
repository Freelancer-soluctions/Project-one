import axios from 'axios'
import store from '../redux/store'
import { jwtDecode } from 'jwt-decode'
import { refreshTokenFecth } from '../modules/auth/slice/authSlice'

// Axios instance
export const axiosPublic = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1',
  withCredentials: true
})
// Axios instance
export const axiosPrivate = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1',
  headers: {
    'Content-Type': 'application/json',
    // 'Authorization': store?.getState()?.auth?.user?.data.accessToken 
  },
  withCredentials: true
})

// AxiosPrivate interceptor
axiosPrivate.interceptors.request.use(
  async (config) => {
    const user = store?.getState()?.auth?.user?.data

    const currentDate = new Date()
    if (user?.accessToken) {
      const decodedToken = jwtDecode(user?.accessToken)
      if (decodedToken.exp * 1000 < currentDate.getTime()) {
        await store.dispatch(refreshTokenFecth())
        console.log('token save', store?.getState()?.auth?.user?.data.accessToken)

        if (config?.headers) {
          config.headers.Authorization = `Bearer ${
            store?.getState()?.auth?.user?.data.accessToken
          }`
        }
      }else{ // temporal quitar este esl de aqui
        if (config?.headers) {
        config.headers.Authorization = `Bearer ${
          store?.getState()?.auth?.user?.data.accessToken
        }`
      }}
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)
// axios basequery for redux tollkit and axiosPrivate
export const axiosPrivateBaseQuery =
  ({ baseUrl } = { baseUrl: '' }) =>
  async ({ url, method, body, params, headers }) => {
    try {
      const result = await axiosPrivate({
        url: baseUrl + url,
        method,
        data: body, // data no se puede cambiar el nombre  es obligatorio
        params,
        headers,
      })
      return { data: result.data }
    } catch (axiosError) {
      const err = axiosError
      return {
        error: {
          status: err.response?.status,
          data: err.response?.data || err.message,
        },
      }
    }
  }

// import { getLocalStorage } from '../utils/utils'

// const getToken = () => {
//   const token = getLocalStorage('token') || ''
//   const Authorization = token && `${token}`
//   return Authorization
// }

// eslint-disable-next-line dot-notation
// axiosPublic.defaults.headers.common['Authorization'] = user?.accessToken

// axiosPublic.defaults.headers.common.Authorization = getToken()
// axiosPrivate.defaults.withCredentials = true

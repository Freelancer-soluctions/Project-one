import axios from 'axios'
import store from '../redux/store'
import { jwtDecode } from 'jwt-decode'
import { refreshTokenFecth } from '../modules/auth/slice/authSlice'

// Axios instance
export const axiosPublic = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1'
})
// Axios instance
export const axiosPrivate = axios.create({
  baseURL: 'http://localhost:3000/api/v1',
  headers: {
    'Content-Type': 'application/json'
    // 'Authorization': store?.getState()?.auth?.user?.data
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
        if (config?.headers) {
          config.headers.Authorization = `Bearer ${
            store?.getState()?.auth?.user?.data.accessToken
          }`
        }
      }
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

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

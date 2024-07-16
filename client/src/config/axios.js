import axios from 'axios'
import store from '../redux/store'
import { jwtDecode } from 'jwt-decode'

import { getLocalStorage } from '../utils/utils'

const getToken = () => {
  const token = getLocalStorage('token') || ''
  const Authorization = token && `${token}`
  return Authorization
}
// Axios instance
export const axiosPublic = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1'
})
// Axios instance
export const axiosPrivate = axios.create({
  baseURL: 'http://localhost:3000/api/v1',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true
})

axiosPrivate.interceptors.request.use(
  async (config) => {
    const user = store?.getState()?.auth?.user

    const currentDate = new Date()
    if (user?.accessToken) {
      const decodedToken = jwtDecode(user?.accessToken)
      if (decodedToken.exp * 1000 < currentDate.getTime()) {
        await store.dispatch(refreshToken())
        if (config?.headers) {
          config.headers.authorization = `Bearer ${
            store?.getState()?.auth?.user?.accessToken
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

// axiosPublic.defaults.headers.common['Authorization'] = getToken()
axiosPublic.defaults.headers.common.Authorization = getToken()

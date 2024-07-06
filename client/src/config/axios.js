import axios from 'axios'
import { getLocalStorage } from '../utils/utils'

const getToken = () => {
  const token = getLocalStorage('token') || ''
  const Authorization = token && `${token}`
  return Authorization
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1'
})

api.defaults.headers.common['x-access-token'] = getToken()

export default api

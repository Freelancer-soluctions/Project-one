import { axiosPublic } from '@/config/axios'
import { AxiosResponse } from 'axios'

export function SignInApi (body:any):Promise<AxiosResponse<any, any>> {
  return axiosPublic.post('/auth/signin', body)
}

export function SignUpApi (body:any):Promise<AxiosResponse<any, any>> {
  return axiosPublic.post('/auth/signup', body)
}

// export function newsApi (id) {
//   return axiosPrivate.delete(`/news/deleteNews/${id}`)
// }

export function RefreshTokenApi ():Promise<AxiosResponse<any, any>> {
  return axiosPublic.get('/auth/refresh-token')
}

import { axiosPublic, axiosPrivate } from '@/config/axios'

export function SignInApi (body) {
  return axiosPublic.post('/auth/signin', body)
}

export function SignUpApi (body) {
  return axiosPublic.post('/auth/signup', body)
}

export function RefreshTokenApi () {
  return axiosPublic.get('/auth/refresh-token')
}

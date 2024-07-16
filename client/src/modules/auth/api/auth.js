import { axiosPublic } from '@/config/axios'

export function SignInApi (body) {
  return axiosPublic.post('/auth/signin', body)
}

export function SignUpApi (body) {
  return axiosPublic.post('/auth/signup', body)
}

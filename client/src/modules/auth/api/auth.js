import axios from '@/config/axios'

export function SignInApi (body) {
  // console.log('dataSigna', body)
  return axios.post('/auth/signin', body)
}

export function SignUpApi (body) {
  return axios.post('/auth/signup', body)
}

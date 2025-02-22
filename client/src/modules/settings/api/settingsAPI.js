import { axiosPrivate } from '@/config/axios'

// export function SignInApi (body) {
//   return axiosPrivate.post('/auth/signin', body)
// }

// export function SignUpApi (body) {
//   return axiosPrivate.post('/auth/signup', body)
// }

export function GetLanguageByUserIdFetch (id) {
  return axiosPrivate.get(`/settings/language/${id}`)
}

export function SaveLanguage (body) {
  return axiosPublic.get('/settings/language', body)
}

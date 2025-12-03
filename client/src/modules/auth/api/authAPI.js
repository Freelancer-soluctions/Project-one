import { axiosPublic, axiosPrivate } from '@/config/axios'
import Cookies from "js-cookie";

export function SignInApi (body) {
  return axiosPublic.post('/auth/signin', body)
}

export function SignUpApi (body) {
  return axiosPublic.post('/auth/signup', body)
}

// export function newsApi (id) {
//   return axiosPrivate.delete(`/news/deleteNews/${id}`)
// }

export function RefreshTokenApi () {
  const csrfToken = Cookies.get('csrfToken');
  return axiosPublic.post('/auth/refresh-token', {}, // body vacío (si no mandas nada)
    {
      withCredentials: true,
      headers: {
        'CSRF-Token': csrfToken
      }
    }
  )
}

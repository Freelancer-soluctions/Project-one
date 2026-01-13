import axios from 'axios';
import { store } from '../redux/store';
import { jwtDecode } from 'jwt-decode';
import { refreshTokenFecth } from '../modules/auth/slice/authSlice';
import Cookies from 'js-cookie';

// Axios instance
export const axiosPublic = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1',
  withCredentials: true, // Incluye cookies automáticamente
});
// Axios instance
export const axiosPrivate = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1',
  headers: {
    'Content-Type': 'application/json',
    // 'Authorization': store?.getState()?.auth?.user?.data.accessToken
  },
  withCredentials: true, // Incluye cookies automáticamente
});

// Interceptor de solicitud (request)
axiosPrivate.interceptors.request.use(
  (config) => {
    const accessToken = sessionStorage.getItem('accessToken');
    if (accessToken) {
      config.headers['Authorization'] = `Bearer ${accessToken}`;
    }

    // Añadir CSRF Token a métodos que lo requieren
    const csrfToken = Cookies.get('csrfToken');
    if (csrfToken) {
      const method = config.method?.toLowerCase();

      // GET no lleva CSRF
      if (['post', 'put', 'patch', 'delete'].includes(method)) {
        config.headers['CSRF-Token'] = csrfToken;
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

axiosPrivate.interceptors.response.use(
  // Maneja la respuesta exitosa
  (response) => {
    return response; // Devuelve la respuesta tal cual si no hay problemas
  },
  async (error) => {
    const originalRequest = error.config; // Guarda la solicitud original en caso de necesitarla

    // Verifica si el error es 401 (no autorizado) y si no se ha intentado renovar el token aún
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true; // Marca la solicitud para evitar reintentos infinitos

      // Intenta obtener un nuevo `accessToken` usando el `refreshToken` almacenado en la cookie
      try {
        await store.dispatch(refreshTokenFecth()); // Refresco la cookie en el servidor

        // Reintenta la solicitud original, agregando el nuevo `accessToken` al header
        originalRequest.headers['Authorization'] =
          `Bearer ${store?.getState()?.auth?.user?.data.accessToken}`;
        return axios(originalRequest); // Vuelve a hacer la solicitud original con el nuevo token
      } catch (refreshError) {
        // Si la renovación falla, rechaza la promesa y maneja el error
        return Promise.reject(refreshError);
      }
    }

    // Si no es un error 401 o ya se intentó renovar, pasa el error
    return Promise.reject(error);
  }
);

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
      });
      return { data: result.data };
    } catch (axiosError) {
      const err = axiosError;
      return {
        error: {
          status: err.response?.status,
          data: err.response?.data || err.message,
        },
      };
    }
  };

// // AxiosPrivate interceptor
// axiosPrivate.interceptors.request.use(
//   async (config) => {
//     const user = store?.getState()?.auth?.user?.data

//     const currentDate = new Date()
//     if (user?.accessToken) {
//       const decodedToken = jwtDecode(user?.accessToken)
//       if (decodedToken.exp * 1000 < currentDate.getTime()) {
//         await store.dispatch(refreshTokenFecth())
//         console.log('token save', store?.getState()?.auth?.user?.data.accessToken)

//         if (config?.headers) {
//           config.headers.Authorization = `Bearer ${
//             store?.getState()?.auth?.user?.data.accessToken
//           }`
//         }
//       }else{ // temporal quitar este esl de aqui esto es temporal por la persistencia que no hay de token
//         if (config?.headers) {
//         config.headers.Authorization = `Bearer ${
//           store?.getState()?.auth?.user?.data.accessToken
//         }`
//       }}
//     }
//     return config
//   },
//   (error) => {
//     return Promise.reject(error)
//   }
// )
// axios basequery for redux tollkit and axiosPrivate

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

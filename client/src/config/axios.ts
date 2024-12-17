import axios, { Method } from 'axios';
import store from '../redux/store';
import { jwtDecode } from 'jwt-decode';
import { refreshTokenFecth } from '../modules/auth/slice/authSlice';

// Types for decoded JWT token
interface DecodedToken {
  exp: number;
}

// Types for AxiosBaseQuery parameters
interface AxiosBaseQueryArgs {
  url: string;
  method: Method;
  data?: any;
  params?: Record<string, any>;
  headers?: Record<string, string>;
}

interface AxiosBaseQueryResponse {
  data?: any;
  error?: {
    status?: number;
    data?: any;
  };
}

// Axios instance for public requests
export const axiosPublic = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1',
  withCredentials: true,
});

// Axios instance for private requests
export const axiosPrivate = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// AxiosPrivate interceptor to handle token refresh
axiosPrivate.interceptors.request.use(
  async (config) => {
    const user = store?.getState()?.auth?.user

    const currentDate = new Date();

    if (user?.accessToken) {
      const decodedToken: DecodedToken = jwtDecode(user?.accessToken);

      // If token is expired, refresh the token
      if (decodedToken.exp * 1000 < currentDate.getTime()) {
        await store.dispatch(refreshTokenFecth());

        // Update Authorization header with the new access token
        const updatedUser = store?.getState()?.auth?.user
        if (config?.headers && updatedUser?.accessToken) {
          config.headers.Authorization = `Bearer ${updatedUser.accessToken}`;
        }
      } else {
        // If token is still valid, set the Authorization header
        if (config?.headers) {
          config.headers.Authorization = `Bearer ${user.accessToken}`;
        }
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Axios basequery for redux toolkit and axiosPrivate
export const axiosPrivateBaseQuery =
  ({ baseUrl } = { baseUrl: '' }) =>
  async ({ url, method, data, params, headers }: AxiosBaseQueryArgs): Promise<AxiosBaseQueryResponse> => {
    try {
      const result = await axiosPrivate({
        url: baseUrl + url,
        method,
        data,
        params,
        headers,
      });
      return { data: result.data };
    } catch (axiosError) {
      const err = axiosError as Error & { response?: { status?: number; data?: any } };
      return {
        error: {
          status: err.response?.status,
          data: err.response?.data || err.message,
        },
      };
    }
  };


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

import { jwtDecode } from 'jwt-decode';

export function getToken() {
  return sessionStorage.getItem('accessToken'); // o sessionStorage
}

export function getUserFromToken() {
  const token = getToken();
  if (!token) return null;

  try {
    return jwtDecode(token); // { id, email, role, iat, exp }
  } catch (err) {
    return err;
  }
}

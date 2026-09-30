import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router';
import { useEffect, useState } from 'react';
import { getUserFromToken } from '../../utils/jwt-decode';
import PropTypes from 'prop-types';

/**
 * Decide si el guard debe redirigir al login: o no hay sesión ni token
 * válidos, o hay sesión pero el id del estado no coincide con el del token.
 */
const shouldRedirectToLogin = ({ authed, tokenOk, stateUserId, tokenUserId }) =>
  (!authed && !tokenOk) ||
  (authed &&
    tokenOk &&
    Number.isFinite(stateUserId) &&
    Number.isFinite(tokenUserId) &&
    stateUserId !== tokenUserId);

export const ProtectedRoutes = ({ children, redirectTo }) => {
  // Accediendo al estado de autenticación
  const user = useSelector((state) => state.auth);

  // Acceder a la información del token. jwtDecode devuelve un Error si el
  // token es inválido y null si no hay token: validar antes de usar `.id`
  // (la versión anterior leía `userToken.id` en las deps y crasheaba).
  const userToken = getUserFromToken();
  const tokenOk =
    !!userToken &&
    typeof userToken === 'object' &&
    !(userToken instanceof Error);
  const tokenUserId = tokenOk ? Number(userToken?.id) : NaN;
  const navigate = useNavigate();

  // Gate de rehidratación: redux-persist hidrata desde sessionStorage en el
  // primer tick; esperar un tick evita redirigir a /signIn cuando hay sesión
  // válida persistida (p. ej. refresh o nueva pestaña).
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setHydrated(true));
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    if (!hydrated) return;

    const authed = !!user?.user && !!user?.isAuth;
    const stateUserId = Number(user?.user?.data?.user?.id);

    if (
      shouldRedirectToLogin({
        authed,
        tokenOk,
        stateUserId,
        tokenUserId,
      })
    ) {
      navigate(redirectTo, { replace: true });
    }
  }, [hydrated, navigate, redirectTo, user, tokenOk, tokenUserId]);

  return children;
};

ProtectedRoutes.propTypes = {
  children: PropTypes.node.isRequired,
  redirectTo: PropTypes.string.isRequired,
};

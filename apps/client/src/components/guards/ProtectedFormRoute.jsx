import { Navigate, useLocation } from 'react-router';
import PropTypes from 'prop-types';

export const ProtectedFormRoute = ({ children }) => {
  const location = useLocation();
  const { state } = location;

  // Si no hay state (es decir, acceso directo), redirigir a /home/products
  if (!state) {
    return <Navigate to="/home" replace />;
  }

  return children; // Renderiza el componente si state es válido
};

ProtectedFormRoute.propTypes = {
  children: PropTypes.node.isRequired,
};

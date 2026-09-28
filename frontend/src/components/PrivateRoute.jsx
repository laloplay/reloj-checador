import { Navigate, useLocation } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

export function PrivateRoute({ children, deviceTipo }) {
  const { token } = useContext(AuthContext);
  const location = useLocation();

  if (!token) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  // DeviceCheck passes the type it just verified with the backend. The global
  // context can still contain a value from the previous route/device check.
  if (!deviceTipo) return null;

  if (deviceTipo !== 'administracion') {
    return <Navigate to="/" replace />;
  }

  return children;
}

import { Navigate, useLocation } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useDevice } from '../context/DeviceContext';

export function PrivateRoute({ children }) {
  const { token } = useContext(AuthContext);
  const { tipo, cargando } = useDevice();
  const location = useLocation();

  if (!token) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  if (cargando) return null;

  if (tipo === 'administracion') {
    return <Navigate to="/" replace />;
  }

  return children;
}

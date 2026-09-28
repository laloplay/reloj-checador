import { Navigate, useLocation } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useDevice } from '../context/DeviceContext';

export function PrivateRoute({ children }) {
  const { token } = useContext(AuthContext);
  const { tipo, cargando, estado } = useDevice();
  const location = useLocation();

  if (cargando || estado !== 'aprobado') {
    return null;
  }

  if (!token) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  if (tipo === 'kiosco') {
    return <Navigate to="/" replace />;
  }

  if (tipo !== 'administracion') {
    return null;
  }

  return children;
}

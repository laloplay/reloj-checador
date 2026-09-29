import { Navigate, useLocation } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useDevice } from '../context/DeviceContext';

/**
 * PrivateRoute — solo lee el contexto, no verifica nada.
 *
 * Precondición: DeviceCheck ya envuelve este componente en el árbol de rutas,
 * por lo que cuando PrivateRoute renderiza children:
 *  - estado === 'aprobado'  (DeviceCheck bloqueó cualquier otro estado)
 *  - cargando === false     (DeviceCheck mostró spinner mientras cargaba)
 *
 * Aquí solo protegemos contra:
 *  1. Sesión de admin no iniciada → redirige a /admin/login
 *  2. Dispositivo tipo 'kiosco' autenticado como admin → redirige a /
 */
export function PrivateRoute({ children }) {
  const { token } = useContext(AuthContext);
  const { tipo } = useDevice();
  const location = useLocation();

  // Sin sesión: redirigir al login conservando la ruta de origen
  if (!token) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  // Dispositivo kiosco no debe acceder al panel de administración
  if (tipo === 'kiosco') {
    return <Navigate to="/" replace />;
  }

  return children;
}

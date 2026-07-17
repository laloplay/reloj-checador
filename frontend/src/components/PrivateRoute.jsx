import { Navigate, useLocation } from 'react-router-dom';
import { AUTH_TOKEN_STORAGE_KEY } from '../services/api';

export function PrivateRoute({ children }) {
  const token = localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
  const location = useLocation();

  if (!token) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  return children;
}

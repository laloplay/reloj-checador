// frontend/src/ProtectedRoute.jsx
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = () => {
  // Revisa si el token existe en el almacenamiento de la sesión.
  const token = sessionStorage.getItem('authToken');

  // Si no hay token, te manda a la página de login.
  if (!token) {
    return <Navigate to="/login-admin" />;
  }

  // Si hay token, te deja ver la página que pediste.
  return <Outlet />;
};

export default ProtectedRoute;
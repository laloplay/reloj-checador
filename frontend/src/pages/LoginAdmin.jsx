// frontend/src/pages/LoginAdmin.jsx
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function LoginAdmin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      // Usamos una ruta relativa para que funcione en local y en producción
      const response = await axios.post('/api/auth/login', { username, password });
      
      // Guardamos el "pase" (token) en el almacenamiento de la sesión.
      // Esto se borra solo al cerrar la pestaña/navegador.
      sessionStorage.setItem('authToken', response.data.token);
      
      // Si el login es exitoso, redirigimos al dashboard del admin.
      navigate('/admin');
    } catch (err) {
      setError('Usuario o contraseña incorrectos.');
      console.error('Error de login:', err);
    }
  };

  return (
    <div className="d-flex align-items-center justify-content-center" style={{ height: '100vh' }}>
      <div className="card shadow-lg" style={{ width: '24rem' }}>
        <div className="card-body p-5">
          <h3 className="card-title text-center mb-4">Acceso Administrativo al</h3>
          <form onSubmit={handleLogin}>
            <div className="form-floating mb-3">
              <input 
                type="text" 
                className="form-control" 
                id="username" 
                value={username} 
                onChange={e => setUsername(e.target.value)} 
                placeholder="Usuario" 
                required 
              />
              <label htmlFor="username">Usuario</label>
            </div>
            <div className="form-floating mb-4">
              <input 
                type="password" 
                id="password" 
                className="form-control" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                placeholder="Contraseña" 
                required 
              />
              <label htmlFor="password">Contraseña</label>
            </div>
            
            {error && <div className="alert alert-danger py-2">{error}</div>}
            
            <button type="submit" className="btn btn-primary w-100 btn-lg">
              Iniciar Sesión
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default LoginAdmin;
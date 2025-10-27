// frontend/src/pages/LoginAdmin.jsx
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
// Importamos los componentes de react-bootstrap
import { Spinner, Alert, Card, Button, Form } from 'react-bootstrap';
import 'animate.css'; // Asegúrate de tener esto instalado: npm install animate.css

function LoginAdmin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false); // Estado para el spinner
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true); // Activa el spinner
    try {
      const response = await axios.post('/api/auth/login', { username, password });
      sessionStorage.setItem('authToken', response.data.token);
      navigate('/admin');
    } catch (err) {
      setError('Usuario o contraseña incorrectos.');
      console.error('Error de login:', err);
      setLoading(false); // Desactiva el spinner si hay error
    }
    // No ponemos setLoading(false) aquí, porque si el login es exitoso, la página redirige.
  };

  return (
    // 1. Usamos el mismo fondo que el Kiosko
    <div className="min-vh-100 d-flex flex-column align-items-center justify-content-center p-3" style={{ background: 'radial-gradient(circle at center, #2c3e50 0%, #1a202c 100%)' }}>
      
      {/* 2. Usamos la misma tarjeta oscura flotante */}
      <Card 
        bg="dark" 
        text="white" 
        className="shadow-lg border-0 mx-auto animate__animated animate__fadeIn" 
        style={{ maxWidth: '450px', borderRadius: '1rem', boxShadow: '0 10px 40px rgba(0,0,0,0.4)' }}
      >
        <Card.Body className="p-5">
          {/* 3. Título "Vivito" con ícono */}
          <div className="text-center mb-4">
            <i className="bi bi-shield-lock-fill display-4 text-primary"></i>
            <h2 className="fw-bold mt-3">Acceso Admin</h2>
          </div>

          <Form onSubmit={handleLogin}>
            {/* 4. Usamos Form.Floating de react-bootstrap para el look moderno */}
            <Form.Floating className="mb-3">
              <Form.Control
                type="text"
                id="username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Usuario"
                required
              />
              <label htmlFor="username" className="text-muted">Usuario</label>
            </Form.Floating>

            <Form.Floating className="mb-4">
              <Form.Control
                type="password"
                id="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Contraseña"
                required
              />
              <label htmlFor="password" className="text-muted">Contraseña</label>
            </Form.Floating>

            {error && (
              <Alert variant="danger" className="d-flex align-items-center py-2 small">
                <i className="bi bi-exclamation-triangle-fill me-2"></i>
                {error}
              </Alert>
            )}

            {/* 5. Botón estilo "píldora" con spinner */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-100 d-flex align-items-center justify-content-center py-3 fs-5 shadow-sm rounded-pill"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" /> Ingresando...
                </>
              ) : (
                <><i className="bi bi-box-arrow-in-right me-2 fs-4"></i> Iniciar Sesión</>
              )}
            </Button>
          </Form>
        </Card.Body>
      </Card>
      
      {/* 6. Footer con enlace de vuelta al Kiosko */}
      <footer className="mt-4 text-center">
         <Link to="/" className="text-white-50 text-decoration-none fw-light" style={{ fontSize: '0.8rem', opacity: 0.5, transition: 'opacity 0.3s ease' }} onMouseOver={e => e.currentTarget.style.opacity = 1} onMouseOut={e => e.currentTarget.style.opacity = 0.5}>
           Volver al Kiosko
         </Link>
      </footer>
    </div>
  );
}

export default LoginAdmin;
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Alert, Spinner, Card, Form, ListGroup, Row, Col, Button } from 'react-bootstrap';
import 'animate.css';

function AdministradoresAdmin() {
  const [items, setItems] = useState([]);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(true);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/admin/users', {
        headers: { Authorization: `Bearer ${sessionStorage.getItem('authToken')}` }
      });
      setItems(response.data);
    } catch (error) { 
      console.error("Error cargando administradores", error); 
      setMessage({ type: 'danger', text: 'Error al cargar los administradores.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchItems(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/auth/register', { username: username.toLowerCase(), password });
      setMessage({ type: 'success', text: `Administrador "${username.toLowerCase()}" creado.` });
      setUsername('');
      setPassword('');
      fetchItems();
    } catch (error) { 
      setMessage({ type: 'danger', text: `Error: ${error.response?.data?.error || 'No se pudo crear.'}` }); 
    }
  };

  const handleDelete = async (id) => {
    if (items.length <= 1) {
      setMessage({ type: 'danger', text: 'No se puede eliminar al último administrador.' });
      return;
    }
    
    if (window.confirm('¿Estás seguro de que quieres borrar a este administrador? Esta acción es irreversible.')) {
      try {
        await axios.delete(`/api/admin/users/${id}`, {
          headers: { Authorization: `Bearer ${sessionStorage.getItem('authToken')}` }
        });
        setMessage({ type: 'success', text: 'Administrador borrado con éxito.' });
        fetchItems();
      } catch (error) { 
        setMessage({ type: 'danger', text: `Error: ${error.response?.data?.error || 'Error al borrar.'}` }); 
      }
    }
  };

  return (
    <div className="animate__animated animate__fadeIn" data-bs-theme="dark"> 
      <header className="pb-3 mb-4 border-bottom border-secondary">
        <h1 className="h3 text-white-50">Gestión de Administradores</h1>
      </header>
      
      {message.text && (
        <Alert variant={message.type} onClose={() => setMessage({ type: '', text: '' })} dismissible>
          {message.text}
        </Alert>
      )}
      
      <Row className="g-4">
        <Col lg={4}>
          <Card bg="dark" text="white" className="shadow-sm border-0" style={{ borderRadius: '1rem' }}>
            <Card.Header className="bg-primary text-white border-0" style={{ borderTopLeftRadius: '1rem', borderTopRightRadius: '1rem' }}>
              <h5 className="mb-0"><i className="bi bi-person-plus-fill me-2"></i>Crear Nuevo Admin</h5>
            </Card.Header>
            <Card.Body className="p-4">
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>Nombre de Usuario</Form.Label>
                  <Form.Control 
                    type="text" 
                    value={username} 
                    onChange={(e) => setUsername(e.target.value)} 
                    placeholder="ej: admin2"
                    required 
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Contraseña</Form.Label>
                  <Form.Control 
                    type="password" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    placeholder="••••••••"
                    required 
                  />
                </Form.Group>
                <Button type="submit" variant="primary" className="w-100 shadow-sm">
                  <i className="bi bi-save-fill me-2"></i>Crear Administrador
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>
        
        <Col lg={8}>
          <Card bg="dark" text="white" className="shadow-sm border-0" style={{ borderRadius: '1rem' }}>
             <Card.Header className="bg-primary text-white border-0" style={{ borderTopLeftRadius: '1rem', borderTopRightRadius: '1rem' }}>
              <h5 className="mb-0"><i className="bi bi-person-badge-fill me-2"></i>Administradores Existentes</h5>
            </Card.Header>
            <Card.Body className="p-0">
              {loading ? (
                <div className="text-center p-5"><Spinner animation="border" /></div>
              ) : (
                <ListGroup variant="flush">
                  {items.map((item, index) => (
                    <ListGroup.Item key={item.id} className="bg-dark text-white d-flex justify-content-between align-items-center p-3" style={ index === 0 ? { borderTop: 'none' } : {}}>
                      <div>
                        <span className="fw-bold fs-5">{item.username}</span>
                        <span className="ms-2 badge bg-success">{item.role}</span>
                      </div>
                      <Button 
                        variant="outline-danger" 
                        size="sm" 
                        onClick={() => handleDelete(item.id)}
                        disabled={items.length <= 1} // Deshabilita el botón si solo queda 1
                      >
                        <i className="bi bi-trash3-fill"></i>
                      </Button>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default AdministradoresAdmin;
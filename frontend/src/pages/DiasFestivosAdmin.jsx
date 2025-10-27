import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button, Form, Alert, Spinner, Card, Row, Col } from 'react-bootstrap';
import 'animate.css';

function DiasFestivosAdmin() {
  const [items, setItems] = useState([]);
  const [fecha, setFecha] = useState('');
  const [nombre, setNombre] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(true);

  const fetchItems = async () => {
    try {
      const response = await axios.get('/api/dias-festivos');
      setItems(response.data);
    } catch (error) { 
      console.error("Error cargando días festivos", error); 
      setMessage({ type: 'danger', text: 'Error al cargar los días festivos.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchItems(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/dias-festivos', { nombre: nombre.toUpperCase(), fecha });
      setMessage({ type: 'success', text: `Día festivo "${nombre.toUpperCase()}" creado.` });
      setNombre('');
      setFecha('');
      fetchItems();
    } catch (error) { 
      setMessage({ type: 'danger', text: `Error: ${error.response?.data?.error || 'No se pudo crear.'}` }); 
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de que quieres borrar este día festivo?')) {
      try {
        await axios.delete(`/api/dias-festivos/${id}`);
        setMessage({ type: 'success', text: 'Día festivo borrado con éxito.' });
        fetchItems();
      } catch (error) { 
        setMessage({ type: 'danger', text: 'Error al borrar el día festivo.' }); 
      }
    }
  };

  const formatFecha = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' };
    return new Date(dateString).toLocaleDateString('es-MX', options);
  };

  return (
    <div className="animate__animated animate__fadeIn" data-bs-theme="dark"> 
      <header className="pb-3 mb-4 border-bottom border-secondary">
        <h1 className="h3 text-white-50">Gestión de Días Festivos</h1>
      </header>
      
      {message.text && (
        <Alert variant={message.type} onClose={() => setMessage({ type: '', text: '' })} dismissible className="d-flex align-items-center">
          {message.type === 'success' && <i className="bi bi-check-circle-fill me-2"></i>}
          {message.type === 'danger' && <i className="bi bi-exclamation-triangle-fill me-2"></i>}
          {message.text}
        </Alert>
      )}
      
      <Row className="g-4">
        <Col lg={4}>
          <Card bg="dark" text="white" className="shadow-sm border-0" style={{ borderRadius: '1rem' }}>
            <Card.Header className="bg-primary text-white border-0" style={{ borderTopLeftRadius: '1rem', borderTopRightRadius: '1rem' }}>
              <h5 className="mb-0"><i className="bi bi-plus-circle-fill me-2"></i>Agregar Día Festivo</h5>
            </Card.Header>
            <Card.Body className="p-4">
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>Nombre del Día Festivo</Form.Label>
                  <Form.Control type="text" value={nombre} onChange={(e) => setNombre(e.target.value.toUpperCase())} placeholder="Ej: NAVIDAD" required />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Fecha</Form.Label>
                  <Form.Control type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} required />
                </Form.Group>
                <Button type="submit" variant="primary" className="w-100 shadow-sm">
                  <i className="bi bi-save-fill me-2"></i>Guardar Día
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>
        
        <Col lg={8}>
          <Card bg="dark" text="white" className="shadow-sm border-0" style={{ borderRadius: '1rem' }}>
             <Card.Header className="bg-primary text-white border-0" style={{ borderTopLeftRadius: '1rem', borderTopRightRadius: '1rem' }}>
              <h5 className="mb-0"><i className="bi bi-calendar2-heart-fill me-2"></i>Días Festivos Registrados</h5>
            </Card.Header>
            <Card.Body>
              <div className="table-responsive">
                <table className="table table-dark table-hover align-middle">
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Nombre</th>
                      <th className="text-end">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan="3" className="text-center"><Spinner animation="border" /></td></tr>
                    ) : (
                      items.map(item => (
                        <tr key={item.id}>
                          <td className="fw-bold">{formatFecha(item.fecha)}</td>
                          <td>{item.nombre}</td>
                          <td className="text-end">
                            <Button variant="outline-danger" size="sm" onClick={() => handleDelete(item.id)}>
                              <i className="bi bi-trash3-fill"></i>
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default DiasFestivosAdmin;
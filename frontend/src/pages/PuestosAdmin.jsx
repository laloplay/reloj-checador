// frontend/src/pages/PuestosAdmin.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Modal, Button, Form, Alert, Spinner, Card, Row, Col } from 'react-bootstrap';
import 'animate.css';

function PuestosAdmin() {
  const [items, setItems] = useState([]);
  const [nombre, setNombre] = useState('');
  const [salarioDiario, setSalarioDiario] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' }); // Estado de mensaje mejorado
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const fetchItems = async () => {
    try {
      // CORREGIDO: Ruta relativa para la API
      const response = await axios.get('/api/puestos');
      setItems(response.data);
    } catch (error) { 
      console.error("Error cargando puestos", error); 
      setMessage({ type: 'danger', text: 'Error al cargar los puestos.' });
    }
  };

  useEffect(() => { fetchItems(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // CORREGIDO: Ruta relativa para la API
      await axios.post('/api/puestos', { nombre: nombre.toUpperCase(), salarioDiario: parseFloat(salarioDiario) });
      setMessage({ type: 'success', text: `Puesto "${nombre.toUpperCase()}" creado.` });
      setNombre(''); setSalarioDiario('');
      fetchItems();
    } catch (error) { 
      setMessage({ type: 'danger', text: `Error: ${error.response?.data?.error || 'No se pudo crear.'}` }); 
    }
  };
  
  const handleUpdate = async () => {
    try {
      // CORREGIDO: Ruta relativa para la API y mayúsculas
      await axios.put(`/api/puestos/${editingItem.id}`, {
        nombre: editingItem.nombre.toUpperCase(),
        salarioDiario: parseFloat(editingItem.salarioDiario)
      });
      setMessage({ type: 'success', text: `Puesto actualizado.` });
      setShowModal(false);
      fetchItems();
    } catch (error) { 
      setMessage({ type: 'danger', text: `Error al actualizar.` }); 
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de que quieres borrar este puesto?')) {
      try {
        // CORREGIDO: Ruta relativa para la API
        await axios.delete(`/api/puestos/${id}`);
        setMessage({ type: 'success', text: 'Puesto borrado con éxito.' });
        fetchItems();
      } catch (error) { 
        setMessage({ type: 'danger', text: 'Error al borrar el puesto.' }); 
      }
    }
  };

  const openEditModal = (item) => {
    setEditingItem({ ...item });
    setShowModal(true);
  };
  
  return (
    // Habilitamos el tema oscuro de Bootstrap para los formularios y modales
    <div className="animate__animated animate__fadeIn" data-bs-theme="dark"> 
      <header className="pb-3 mb-4 border-bottom border-secondary">
        <h1 className="h3 text-white-50">Gestión de Puestos y Salarios</h1>
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
              <h5 className="mb-0"><i className="bi bi-plus-circle-fill me-2"></i>Crear Nuevo Puesto</h5>
            </Card.Header>
            <Card.Body className="p-4">
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>Nombre del Puesto</Form.Label>
                  <Form.Control type="text" value={nombre} onChange={(e) => setNombre(e.target.value.toUpperCase())} required />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Salario Diario</Form.Label>
                  <Form.Control type="number" step="0.01" value={salarioDiario} onChange={(e) => setSalarioDiario(e.target.value)} required />
                </Form.Group>
                <Button type="submit" variant="primary" className="w-100 shadow-sm">
                  <i className="bi bi-save-fill me-2"></i>Crear Puesto
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>
        
        <Col lg={8}>
          <Card bg="dark" text="white" className="shadow-sm border-0" style={{ borderRadius: '1rem' }}>
             <Card.Header className="bg-primary text-white border-0" style={{ borderTopLeftRadius: '1rem', borderTopRightRadius: '1rem' }}>
              <h5 className="mb-0"><i className="bi bi-list-task me-2"></i>Puestos Existentes</h5>
            </Card.Header>
            <Card.Body>
              {/* div adaptable para la tabla en móviles */}
              <div className="table-responsive">
                <table className="table table-dark table-hover align-middle">
                  <thead>
                    <tr>
                      <th>Nombre</th>
                      <th>Salario Diario</th>
                      <th className="text-end">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map(item => (
                      <tr key={item.id}>
                        <td className="fw-bold">{item.nombre}</td>
                        <td>${parseFloat(item.salarioDiario).toFixed(2)}</td>
                        <td className="text-end">
                          {/* BOTONES CON ÍCONOS (NO EMOJIS) */}
                          <Button variant="outline-warning" size="sm" className="me-2" onClick={() => openEditModal(item)}>
                            <i className="bi bi-pencil-fill"></i>
                          </Button>
                          <Button variant="outline-danger" size="sm" onClick={() => handleDelete(item.id)}>
                            <i className="bi bi-trash3-fill"></i>
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Modal de Edición (hereda el tema oscuro) */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Editar Puesto</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Nombre</Form.Label>
              <Form.Control type="text" value={editingItem?.nombre || ''} onChange={(e) => setEditingItem({...editingItem, nombre: e.target.value.toUpperCase()})} />
            </Form.Group>
            <Form.Group>
              <Form.Label>Salario Diario</Form.Label>
              <Form.Control type="number" step="0.01" value={editingItem?.salarioDiario || ''} onChange={(e) => setEditingItem({...editingItem, salarioDiario: e.target.value})} />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>Cancelar</Button>
          <Button variant="primary" onClick={handleUpdate}>Guardar Cambios</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default PuestosAdmin;
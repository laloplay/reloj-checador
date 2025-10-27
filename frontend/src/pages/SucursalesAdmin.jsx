import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Modal, Button, Form, Alert, Spinner, Card, Row, Col } from 'react-bootstrap';
import 'animate.css';

function SucursalesAdmin() {
  const [items, setItems] = useState([]);
  const [nombre, setNombre] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const fetchItems = async () => {
    try {
      const response = await axios.get('/api/sucursales');
      setItems(response.data);
    } catch (error) { 
      console.error("Error cargando sucursales", error); 
      setMessage({ type: 'danger', text: 'Error al cargar las sucursales.' });
    }
  };

  useEffect(() => { fetchItems(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/sucursales', { nombre: nombre.toUpperCase() });
      setMessage({ type: 'success', text: `Sucursal "${nombre.toUpperCase()}" creada.` });
      setNombre('');
      fetchItems();
    } catch (error) { 
      setMessage({ type: 'danger', text: `Error: ${error.response?.data?.error || 'No se pudo crear.'}` }); 
    }
  };
  
  const handleUpdate = async () => {
    try {
      await axios.put(`/api/sucursales/${editingItem.id}`, {
        nombre: editingItem.nombre.toUpperCase()
      });
      setMessage({ type: 'success', text: `Sucursal actualizada.` });
      setShowModal(false);
      fetchItems();
    } catch (error) { 
      setMessage({ type: 'danger', text: `Error al actualizar.` }); 
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de que quieres borrar esta sucursal?')) {
      try {
        await axios.delete(`/api/sucursales/${id}`);
        setMessage({ type: 'success', text: 'Sucursal borrada con éxito.' });
        fetchItems();
      } catch (error) { 
        setMessage({ type: 'danger', text: 'Error al borrar la sucursal.' }); 
      }
    }
  };

  const openEditModal = (item) => {
    setEditingItem({ ...item });
    setShowModal(true);
  };
  
  return (
    <div className="animate__animated animate__fadeIn" data-bs-theme="dark"> 
      <header className="pb-3 mb-4 border-bottom border-secondary">
        <h1 className="h3 text-white-50">Gestión de Sucursales</h1>
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
              <h5 className="mb-0"><i className="bi bi-plus-circle-fill me-2"></i>Crear Nueva Sucursal</h5>
            </Card.Header>
            <Card.Body className="p-4">
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>Nombre de la Sucursal</Form.Label>
                  <Form.Control 
                    type="text" 
                    value={nombre} 
                    onChange={(e) => setNombre(e.target.value.toUpperCase())} 
                    required 
                  />
                </Form.Group>
                <Button type="submit" variant="primary" className="w-100 shadow-sm">
                  <i className="bi bi-save-fill me-2"></i>Crear Sucursal
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>
        
        <Col lg={8}>
          <Card bg="dark" text="white" className="shadow-sm border-0" style={{ borderRadius: '1rem' }}>
             <Card.Header className="bg-primary text-white border-0" style={{ borderTopLeftRadius: '1rem', borderTopRightRadius: '1rem' }}>
              <h5 className="mb-0"><i className="bi bi-list-task me-2"></i>Sucursales Existentes</h5>
            </Card.Header>
            <Card.Body>
              <div className="table-responsive">
                <table className="table table-dark table-hover align-middle">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Nombre</th>
                      <th className="text-end">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map(item => (
                      <tr key={item.id}>
                        <td>{item.id}</td>
                        <td className="fw-bold">{item.nombre}</td>
                        <td className="text-end">
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

      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Editar Sucursal</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group>
              <Form.Label>Nombre</Form.Label>
              <Form.Control 
                type="text" 
                value={editingItem?.nombre || ''} 
                onChange={(e) => setEditingItem({...editingItem, nombre: e.target.value.toUpperCase()})} 
              />
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

export default SucursalesAdmin;
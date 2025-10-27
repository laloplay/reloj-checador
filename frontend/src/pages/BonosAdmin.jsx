import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Modal, Button, Form, Alert, Spinner, Card, Row, Col } from 'react-bootstrap';
import 'animate.css';

function BonosAdmin() {
  const [items, setItems] = useState([]);
  const [nombre, setNombre] = useState('');
  const [monto, setMonto] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const fetchItems = async () => {
    try {
      const response = await axios.get('/api/bonos');
      setItems(response.data);
    } catch (error) { 
      console.error("Error cargando bonos", error); 
      setMessage({ type: 'danger', text: 'Error al cargar los bonos.' });
    }
  };

  useEffect(() => { fetchItems(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/bonos', { nombre: nombre.toUpperCase(), monto: parseFloat(monto) });
      setMessage({ type: 'success', text: `Bono "${nombre.toUpperCase()}" creado.` });
      setNombre(''); setMonto('');
      fetchItems();
    } catch (error) { 
      setMessage({ type: 'danger', text: `Error: ${error.response?.data?.error || 'No se pudo crear.'}` }); 
    }
  };
  
  const handleUpdate = async () => {
    try {
      await axios.put(`/api/bonos/${editingItem.id}`, {
        nombre: editingItem.nombre.toUpperCase(),
        monto: parseFloat(editingItem.monto)
      });
      setMessage({ type: 'success', text: `Bono actualizado.` });
      setShowModal(false);
      fetchItems();
    } catch (error) { 
      setMessage({ type: 'danger', text: `Error al actualizar.` }); 
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de que quieres borrar este bono?')) {
      try {
        await axios.delete(`/api/bonos/${id}`);
        setMessage({ type: 'success', text: 'Bono borrado con éxito.' });
        fetchItems();
      } catch (error) { 
        setMessage({ type: 'danger', text: 'Error al borrar el bono.' }); 
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
        <h1 className="h3 text-white-50">Gestión de Bonos</h1>
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
              <h5 className="mb-0"><i className="bi bi-plus-circle-fill me-2"></i>Crear Nuevo Bono</h5>
            </Card.Header>
            <Card.Body className="p-4">
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>Nombre del Bono</Form.Label>
                  <Form.Control type="text" value={nombre} onChange={(e) => setNombre(e.target.value.toUpperCase())} required />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Monto</Form.Label>
                  <Form.Control type="number" step="0.01" value={monto} onChange={(e) => setMonto(e.target.value)} required />
                </Form.Group>
                <Button type="submit" variant="primary" className="w-100 shadow-sm">
                  <i className="bi bi-save-fill me-2"></i>Crear Bono
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>
        
        <Col lg={8}>
          <Card bg="dark" text="white" className="shadow-sm border-0" style={{ borderRadius: '1rem' }}>
             <Card.Header className="bg-primary text-white border-0" style={{ borderTopLeftRadius: '1rem', borderTopRightRadius: '1rem' }}>
              <h5 className="mb-0"><i className="bi bi-list-task me-2"></i>Bonos Existentes</h5>
            </Card.Header>
            <Card.Body>
              <div className="table-responsive">
                <table className="table table-dark table-hover align-middle">
                  <thead>
                    <tr>
                      <th>Nombre</th>
                      <th>Monto</th>
                      <th className="text-end">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map(item => (
                      <tr key={item.id}>
                        <td className="fw-bold">{item.nombre}</td>
                        <td>${parseFloat(item.monto).toFixed(2)}</td>
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
          <Modal.Title>Editar Bono</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Nombre</Form.Label>
              <Form.Control type="text" value={editingItem?.nombre || ''} onChange={(e) => setEditingItem({...editingItem, nombre: e.target.value.toUpperCase()})} />
            </Form.Group>
            <Form.Group>
              <Form.Label>Monto</Form.Label>
              <Form.Control type="number" step="0.01" value={editingItem?.monto || ''} onChange={(e) => setEditingItem({...editingItem, monto: e.target.value})} />
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

export default BonosAdmin;
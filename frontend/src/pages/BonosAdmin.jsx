import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Modal, Button, Form, Alert, Spinner, Card, Row, Col, InputGroup } from 'react-bootstrap';
import 'animate.css';

function BonosAdmin() {
  const [items, setItems] = useState([]);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Estados para el formulario de creación
  const [nombre, setNombre] = useState('');
  const [monto, setMonto] = useState('');
  const [tieneCondicion, setTieneCondicion] = useState(false);
  const [tipoCondicion, setTipoCondicion] = useState('NINGUNO');
  const [valorCondicion, setValorCondicion] = useState(0);

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

  const resetForm = () => {
    setNombre('');
    setMonto('');
    setTieneCondicion(false);
    setTipoCondicion('NINGUNO');
    setValorCondicion(0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const bonoData = {
        nombre: nombre.toUpperCase(),
        monto: parseFloat(monto),
        tipo_condicion: tieneCondicion ? tipoCondicion : 'NINGUNO',
        valor_condicion: tieneCondicion ? -Math.abs(parseInt(valorCondicion, 10)) : 0 // Guardamos "minutos antes" como negativo
      };

      await axios.post('/api/bonos', bonoData);
      setMessage({ type: 'success', text: `Bono "${bonoData.nombre}" creado.` });
      resetForm();
      fetchItems();
    } catch (error) { 
      setMessage({ type: 'danger', text: `Error: ${error.response?.data?.error || 'No se pudo crear.'}` }); 
    }
  };
  
  const handleUpdate = async () => {
    try {
      const updateData = {
        ...editingItem,
        nombre: editingItem.nombre.toUpperCase(),
        monto: parseFloat(editingItem.monto),
        tipo_condicion: editingItem.tipo_condicion || 'NINGUNO',
        valor_condicion: editingItem.tipo_condicion !== 'NINGUNO' ? -Math.abs(parseInt(editingItem.valor_condicion, 10)) : 0
      };

      await axios.put(`/api/bonos/${editingItem.id}`, updateData);
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
    setEditingItem({
      ...item,
      // Convertimos el valor negativo de la BD a positivo para el formulario
      valor_condicion: item.valor_condicion ? Math.abs(item.valor_condicion) : 0
    });
    setShowModal(true);
  };

  // Helper para mostrar la condición en la tabla
  const formatCondicion = (bono) => {
    if (bono.tipo_condicion === 'PUNTUALIDAD') {
      return `Llegar ${Math.abs(bono.valor_condicion)} min. antes`;
    }
    return <span className="text-white-50">Sin Condición</span>;
  };
  
  return (
    <div className="animate__animated animate__fadeIn" data-bs-theme="dark"> 
      <header className="pb-3 mb-4 border-bottom border-secondary">
        <h1 className="h3 text-white-50">Gestión de Bonos</h1>
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
              <h5 className="mb-0"><i className="bi bi-plus-circle-fill me-2"></i>Crear Nuevo Bono</h5>
            </Card.Header>
            <Card.Body className="p-4">
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>Nombre del Bono</Form.Label>
                  <Form.Control type="text" value={nombre} onChange={(e) => setNombre(e.target.value.toUpperCase())} placeholder="Ej: BONO PUNTUALIDAD" required />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Monto</Form.Label>
                  <InputGroup>
                    <InputGroup.Text>$</InputGroup.Text>
                    <Form.Control type="number" step="0.01" value={monto} onChange={(e) => setMonto(e.target.value)} placeholder="Ej: 300.00" required />
                  </InputGroup>
                </Form.Group>
                
                <Form.Check 
                  type="switch"
                  id="condicion-switch"
                  label="Este bono tiene una condición"
                  checked={tieneCondicion}
                  onChange={(e) => setTieneCondicion(e.target.checked)}
                  className="mb-3 fs-5"
                />

                {tieneCondicion && (
                  <div className="animate__animated animate__fadeIn ms-3 ps-3 border-start border-primary">
                    <Form.Group className="mb-3">
                      <Form.Label>Tipo de Condición</Form.Label>
                      <Form.Select value={tipoCondicion} onChange={(e) => setTipoCondicion(e.target.value)}>
                        <option value="NINGUNO">Seleccionar...</option>
                        <option value="PUNTUALIDAD">Puntualidad</option>
                      </Form.Select>
                    </Form.Group>
                    
                    {tipoCondicion === 'PUNTUALIDAD' && (
                      <Form.Group className="mb-3 animate__animated animate__fadeIn">
                        <Form.Label>Minutos antes de la hora de entrada</Form.Label>
                        <InputGroup>
                          <Form.Control type="number" value={valorCondicion} onChange={(e) => setValorCondicion(e.target.value)} required />
                          <InputGroup.Text>min.</InputGroup.Text>
                        </InputGroup>
                      </Form.Group>
                    )}
                  </div>
                )}
                
                <Button type="submit" variant="primary" className="w-100 shadow-sm mt-3">
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
                      <th>Condición</th>
                      <th className="text-end">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map(item => (
                      <tr key={item.id}>
                        <td className="fw-bold">{item.nombre}</td>
                        <td>${parseFloat(item.monto).toFixed(2)}</td>
                        <td>{formatCondicion(item)}</td>
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
            <Form.Group className="mb-3">
              <Form.Label>Monto</Form.Label>
              <InputGroup>
                <InputGroup.Text>$</InputGroup.Text>
                <Form.Control type="number" step="0.01" value={editingItem?.monto || ''} onChange={(e) => setEditingItem({...editingItem, monto: e.target.value})} />
              </InputGroup>
            </Form.Group>
            <Form.Check 
              type="switch"
              id="condicion-switch-modal"
              label="Este bono tiene una condición"
              checked={editingItem?.tipo_condicion !== 'NINGUNO'}
              onChange={(e) => setEditingItem({...editingItem, tipo_condicion: e.target.checked ? 'PUNTUALIDAD' : 'NINGUNO'})}
              className="mb-3 fs-5"
            />
            {editingItem?.tipo_condicion !== 'NINGUNO' && (
              <div className="animate__animated animate__fadeIn ms-3 ps-3 border-start border-primary">
                <Form.Group className="mb-3">
                  <Form.Label>Tipo de Condición</Form.Label>
                  <Form.Select value={editingItem?.tipo_condicion || 'NINGUNO'} onChange={(e) => setEditingItem({...editingItem, tipo_condicion: e.target.value})}>
                    <option value="NINGUNO">Seleccionar...</option>
                    <option value="PUNTUALIDAD">Puntualidad</option>
                  </Form.Select>
                </Form.Group>
                
                {editingItem?.tipo_condicion === 'PUNTUALIDAD' && (
                  <Form.Group className="mb-3 animate__animated animate__fadeIn">
                    <Form.Label>Minutos antes de la hora de entrada</Form.Label>
                    <InputGroup>
                      <Form.Control type="number" value={editingItem?.valor_condicion || 0} onChange={(e) => setEditingItem({...editingItem, valor_condicion: e.target.value})} />
                      <InputGroup.Text>min.</InputGroup.Text>
                    </InputGroup>
                  </Form.Group>
                )}
              </div>
            )}
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
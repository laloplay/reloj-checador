import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Modal, Button, Form, Alert, Spinner, Card, Row, Col } from 'react-bootstrap';
import 'animate.css';

function GestionEmpleados() {
  const [empleados, setEmpleados] = useState([]);
  const [listaPuestos, setListaPuestos] = useState([]);
  const [listaSucursales, setListaSucursales] = useState([]);
  const [listaBonos, setListaBonos] = useState([]);
  
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [empRes, puestosRes, sucursalesRes, bonosRes] = await Promise.all([
        axios.get('/api/employees'),
        axios.get('/api/puestos'),
        axios.get('/api/sucursales'),
        axios.get('/api/bonos')
      ]);
      setEmpleados(empRes.data);
      setListaPuestos(puestosRes.data);
      setListaSucursales(sucursalesRes.data);
      setListaBonos(bonosRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
      setMessage({ type: 'danger', text: 'Error al cargar los datos.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    fetchData(); 
  }, []);

  const handleUpdate = async () => {
    if (!editingItem) return;
    
    try {
      await axios.put(`/api/employees/${editingItem.id}`, editingItem);
      setMessage({ type: 'success', text: 'Empleado actualizado con éxito.' });
      setShowModal(false);
      fetchData(); 
    } catch (error) { 
      setMessage({ type: 'danger', text: `Error al actualizar: ${error.response?.data?.error || ''}` }); 
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de que quieres borrar este empleado? Esto también borrará su rostro de la base de datos.')) {
      try {
        await axios.delete(`/api/employees/${id}`);
        setMessage({ type: 'success', text: 'Empleado eliminado con éxito.' });
        fetchData();
      } catch (error) { 
        setMessage({ type: 'danger', text: 'Error al borrar el empleado.' }); 
      }
    }
  };

  const openEditModal = (item) => {
    setEditingItem({ ...item });
    setShowModal(true);
  };
  
  const handleModalChange = (e) => {
    const { name, value } = e.target;
    setEditingItem(prev => ({ ...prev, [name]: value }));
  };

  const handleModalPuestoChange = (e) => {
    const newPuestoNombre = e.target.value;
    const puestoSel = listaPuestos.find(p => p.nombre === newPuestoNombre);
    setEditingItem(prev => ({
      ...prev,
      puesto: newPuestoNombre,
      salario: puestoSel ? puestoSel.salarioDiario : 0
    }));
  };

  const handleModalBonoChange = (e) => {
    const newBonoNombre = e.target.value;
    const bonoSel = listaBonos.find(b => b.nombre === newBonoNombre);
    setEditingItem(prev => ({
      ...prev,
      bono: bonoSel ? bonoSel.monto : 0
    }));
  };

  const getBonoNombreFromMonto = (monto) => {
    if (monto === 0 || !monto) return "";
    const bonoSel = listaBonos.find(b => b.monto === monto);
    return bonoSel ? bonoSel.nombre : "";
  };

  return (
    <div className="animate__animated animate__fadeIn" data-bs-theme="dark"> 
      <header className="pb-3 mb-4 border-bottom border-secondary">
        <h1 className="h3 text-white-50">Gestionar Empleados</h1>
      </header>
      
      {message.text && (
        <Alert variant={message.type} onClose={() => setMessage({ type: '', text: '' })} dismissible>
          {message.text}
        </Alert>
      )}
      
      <Card bg="dark" text="white" className="shadow-sm border-0" style={{ borderRadius: '1rem' }}>
         <Card.Header className="bg-primary text-white border-0" style={{ borderTopLeftRadius: '1rem', borderTopRightRadius: '1rem' }}>
          <h5 className="mb-0"><i className="bi bi-people-fill me-2"></i>Lista de Empleados</h5>
        </Card.Header>
        <Card.Body>
          <div className="table-responsive">
            <table className="table table-dark table-hover align-middle">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Sucursal</th>
                  <th>Puesto</th>
                  <th className="text-end">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="4" className="text-center"><Spinner animation="border" /></td></tr>
                ) : (
                  empleados.map(item => (
                    <tr key={item.id}>
                      <td className="fw-bold">{item.nombre}</td>
                      <td>{item.sucursal}</td>
                      <td>{item.puesto}</td>
                      <td className="text-end">
                        <Button variant="outline-warning" size="sm" className="me-2" onClick={() => openEditModal(item)}>
                          <i className="bi bi-pencil-fill"></i>
                        </Button>
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

      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Editar Empleado</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Nombre Completo</Form.Label>
              <Form.Control type="text" name="nombre" value={editingItem?.nombre || ''} onChange={handleModalChange} />
            </Form.Group>
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Sucursal</Form.Label>
                  <Form.Select name="sucursal" value={editingItem?.sucursal || ''} onChange={handleModalChange}>
                    <option value="">Seleccione...</option>
                    {listaSucursales.map(s => <option key={s.id} value={s.nombre}>{s.nombre}</option>)}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Puesto</Form.Label>
                  <Form.Select name="puesto" value={editingItem?.puesto || ''} onChange={handleModalPuestoChange}>
                    <option value="">Seleccione...</option>
                    {listaPuestos.map(p => <option key={p.id} value={p.nombre}>{p.nombre}</option>)}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Fecha de Ingreso</Form.Label>
                  <Form.Control type="date" name="fechaIngreso" value={editingItem?.fechaIngreso ? new Date(editingItem.fechaIngreso).toISOString().split('T')[0] : ''} onChange={handleModalChange} />
                </Form.Group>
              </Col>
              <Col md={6}>
                 <Form.Group className="mb-3">
                  <Form.Label>Bono</Form.Label>
                  <Form.Select value={getBonoNombreFromMonto(editingItem?.bono)} onChange={handleModalBonoChange}>
                    <option value="">Ninguno</option>
                     {listaBonos.map(b => <option key={b.id} value={b.nombre}>{b.nombre}</option>)}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

             <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Hora de Entrada</Form.Label>
                  <Form.Control type="time" name="horaEntrada" value={editingItem?.horaEntrada || ''} onChange={handleModalChange} />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Hora de Salida</Form.Label>
                  <Form.Control type="time" name="horaSalida" value={editingItem?.horaSalida || ''} onChange={handleModalChange} />
                </Form.Group>
              </Col>
            </Row>
            
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

export default GestionEmpleados;
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
// ¡Importaciones corregidas y completas!
import { Spinner, Alert, Card, Button, Form, ListGroup, Tabs, Tab, Modal } from 'react-bootstrap';
import 'animate.css';

const socket = io();

function DispositivosAdmin() {
  const [pendingDevices, setPendingDevices] = useState([]);
  const [approvedDevices, setApprovedDevices] = useState([]);
  const [rejectedDevices, setRejectedDevices] = useState([]);
  
  const [sucursales, setSucursales] = useState([]);
  const [selectedSucursal, setSelectedSucursal] = useState({});
  const [message, setMessage] = useState({ type: '', text: '' });
  const [key, setKey] = useState('pendientes');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  useEffect(() => {
    fetchSucursales();
    fetchAllDevices();

    socket.on('new_device_request', (newDevice) => {
      setPendingDevices(prevDevices => [newDevice, ...prevDevices]);
      setMessage({ type: 'info', text: '¡Ha llegado una nueva solicitud de dispositivo!' });
    });

    return () => {
      socket.off('new_device_request');
    };
  }, []);

  const fetchAllDevices = () => {
    fetchPendingDevices();
    fetchApprovedDevices();
    fetchRejectedDevices();
  };

  const fetchPendingDevices = async () => {
    try {
      const response = await axios.get('/api/devices/pending');
      setPendingDevices(response.data);
    } catch (error) { console.error("Error cargando dispositivos pendientes:", error); }
  };
  
  const fetchApprovedDevices = async () => {
    try {
      const response = await axios.get('/api/devices/approved');
      setApprovedDevices(response.data);
    } catch (error) { console.error("Error cargando dispositivos aprobados:", error); }
  };

  const fetchRejectedDevices = async () => {
    try {
      const response = await axios.get('/api/devices/rejected');
      setRejectedDevices(response.data);
    } catch (error) { console.error("Error cargando dispositivos rechazados:", error); }
  };

  const fetchSucursales = async () => {
    try {
      const response = await axios.get('/api/sucursales');
      setSucursales(response.data);
    } catch (error) { console.error("Error cargando sucursales:", error); }
  };

  const handleApprove = async (deviceId) => {
    const sucursalId = selectedSucursal[deviceId];
    if (!sucursalId) {
      setMessage({ type: 'warning', text: 'Por favor, selecciona una sucursal para este dispositivo.' });
      return;
    }
    try {
      await axios.post('/api/devices/approve', { id: deviceId, sucursalId: sucursalId });
      setMessage({ type: 'success', text: 'Dispositivo aprobado con éxito.' });
      fetchAllDevices();
      setSelectedSucursal(prev => ({...prev, [deviceId]: null}));
    } catch (error) {
      setMessage({ type: 'danger', text: 'Hubo un error al aprobar el dispositivo.' });
    }
  };
  
  const handleReject = async (deviceId) => {
    if (!window.confirm('¿Estás seguro de que quieres rechazar este dispositivo?')) return;
    try {
      await axios.post('/api/devices/reject', { id: deviceId });
      setMessage({ type: 'success', text: 'Dispositivo rechazado.' });
      fetchAllDevices();
    } catch (error) {
      setMessage({ type: 'danger', text: 'Hubo un error al rechazar.' });
    }
  };
  
  const handleSetPending = async (deviceId) => {
    if (!window.confirm('¿Mover este dispositivo a "Pendientes" para re-asignarlo?')) return;
    try {
      await axios.post('/api/devices/set-pending', { id: deviceId });
      setMessage({ type: 'info', text: 'Dispositivo movido a Pendientes.' });
      fetchAllDevices();
      setKey('pendientes');
    } catch (error) {
      setMessage({ type: 'danger', text: 'Hubo un error al mover a pendientes.' });
    }
  };

  const handleSelectChange = (deviceId, sucursalId) => {
    setSelectedSucursal(prev => ({ ...prev, [deviceId]: sucursalId }));
  };

  const renderDeviceList = (devices, type) => {
    if (devices.length === 0) {
      return <p className="text-white-50 p-4 text-center">No hay dispositivos en esta categoría.</p>;
    }
    return (
      <ListGroup variant="flush">
        {devices.map((device, index) => (
          <ListGroup.Item key={device.id} className="bg-dark text-white d-flex flex-column flex-md-row justify-content-between align-items-md-center p-3" style={ index === 0 ? { borderTop: 'none' } : {}}>
            <div className="mb-2 mb-md-0">
              <span className="fw-bold"><i className="bi bi-tablet-landscape me-2 text-primary"></i>{device.nombre}</span>
              <br />
              <span className="text-white-50 small font-monospace">{device.fingerprint}</span>
              {type === 'approved' && device.Sucursal && (
                <span className="ms-2 badge bg-success">{device.Sucursal.nombre}</span>
              )}
            </div>
            <div className="d-flex w-100 w-md-auto">
              {type === 'pendientes' && (
                <>
                  <Form.Select size="sm" className="me-2" onChange={(e) => handleSelectChange(device.id, e.target.value)} value={selectedSucursal[device.id] || ''}>
                    <option value="">Asignar a...</option>
                    {sucursales.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                  </Form.Select>
                  <Button variant="outline-success" size="sm" className="me-2" onClick={() => handleApprove(device.id)}><i className="bi bi-check-lg"></i></Button>
                  <Button variant="outline-danger" size="sm" onClick={() => handleReject(device.id)}><i className="bi bi-x-lg"></i></Button>
                </>
              )}
              {type === 'approved' && (
                <Button variant="outline-danger" size="sm" onClick={() => handleReject(device.id)}>Rechazar</Button>
              )}
              {type === 'rejected' && (
                <Button variant="outline-warning" size="sm" onClick={() => handleSetPending(device.id)}>Mover a Pendientes</Button>
              )}
            </div>
          </ListGroup.Item>
        ))}
      </ListGroup>
    );
  };

  return (
    <div className="animate__animated animate__fadeIn" data-bs-theme="dark">
      <header className="pb-3 mb-4 border-bottom border-secondary">
        <h1 className="h3 text-white-50">Gestión de Dispositivos</h1>
      </header>
      
      {message.text && (
        <Alert variant={message.type} onClose={() => setMessage({ type: '', text: '' })} dismissible>
          {message.text}
        </Alert>
      )}

      {/* ========================================================== */}
      {/* ¡AQUÍ ESTÁ LA ESTRUCTURA CORREGIDA DE LAS PESTAÑAS! */}
      {/* ========================================================== */}
      <Tabs activeKey={key} onSelect={(k) => setKey(k)} id="device-tabs" className="nav-tabs-custom" fill>
        
        <Tab eventKey="pendientes" title={<><i className="bi bi-hourglass-split me-2"></i>Pendientes <span className="badge bg-light text-dark ms-1">{pendingDevices.length}</span></>}>
          <Card bg="dark" text="white" className="shadow-sm border-0" style={{ borderTopLeftRadius: 0, borderTopRightRadius: 0 }}>
            <Card.Body className="p-0">
              {renderDeviceList(pendingDevices, 'pendientes')}
            </Card.Body>
          </Card>
        </Tab>
        
        <Tab eventKey="aprobados" title={<><i className="bi bi-check-circle-fill me-2"></i>Aprobados</>}>
          <Card bg="dark" text="white" className="shadow-sm border-0" style={{ borderTopLeftRadius: 0, borderTopRightRadius: 0 }}>
            <Card.Body className="p-0">
              {renderDeviceList(approvedDevices, 'approved')}
            </Card.Body>
          </Card>
        </Tab>
        
        <Tab eventKey="rechazados" title={<><i className="bi bi-x-octagon-fill me-2"></i>Rechazados</>}>
          <Card bg="dark" text="white" className="shadow-sm border-0" style={{ borderTopLeftRadius: 0, borderTopRightRadius: 0 }}>
            <Card.Body className="p-0">
              {renderDeviceList(rejectedDevices, 'rejected')}
            </Card.Body>
          </Card>
        </Tab>

      </Tabs>

      {/* --- Modal de Edición (¡Importante!) --- */}
      {/* Lo dejamos aquí por si lo necesitas para editar dispositivos en el futuro */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Editar Dispositivo</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {/* Aquí iría un formulario si quisieras editar el nombre, etc. */}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>Cancelar</Button>
          <Button variant="primary">Guardar Cambios</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default DispositivosAdmin;


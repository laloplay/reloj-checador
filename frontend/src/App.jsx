// frontend/src/App.jsx
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import axios from 'axios';
import io from 'socket.io-client';
// IMPORTAMOS LOS COMPONENTES DE BOOTSTRAP QUE USAREMOS
import { Spinner, Alert, Card, Button, Form, Row, Col, ListGroup } from 'react-bootstrap';
import 'animate.css'; // Asegúrate de tener esto: npm install animate.css

// --- COMPONENTES PRINCIPALES ---
import Kiosk from './Kiosk';
import AdminLayout from './AdminLayout';
import ProtectedRoute from './ProtectedRoute';
import RegistrosAdmin from './pages/RegistrosAdmin';

// --- PÁGINAS DEL ADMIN ---
import LoginAdmin from './pages/LoginAdmin';
import NuevoRegistro from './pages/NuevoRegistro';
import PuestosAdmin from './pages/PuestosAdmin';
import SucursalesAdmin from './pages/SucursalesAdmin';
import BonosAdmin from './pages/BonosAdmin';

// --- CONFIGURACIÓN DE SOCKET.IO ---
const socket = io();

// ==========================================================
//  DASHBOARD REDISEÑADO AL ESTILO "FINO Y VIVITO"
// ==========================================================
function AdminDashboard() {
  const [pendingDevices, setPendingDevices] = useState([]);
  const [sucursales, setSucursales] = useState([]);
  const [selectedSucursal, setSelectedSucursal] = useState({});
  const [message, setMessage] = useState({ type: '', text: '' }); // Estado de mensaje mejorado

  useEffect(() => {
    fetchPendingDevices();
    fetchSucursales();

    socket.on('new_device_request', (newDevice) => {
      setPendingDevices(prevDevices => [newDevice, ...prevDevices]);
      setMessage({ type: 'info', text: '¡Ha llegado una nueva solicitud de dispositivo!' });
    });

    return () => {
      socket.off('new_device_request');
    };
  }, []);

  const fetchPendingDevices = async () => {
    try {
      const response = await axios.get('/api/devices/pending');
      setPendingDevices(response.data);
    } catch (error) {
      console.error("Error cargando dispositivos pendientes:", error);
    }
  };
  
  const fetchSucursales = async () => {
    try {
      const response = await axios.get('/api/sucursales');
      setSucursales(response.data);
    } catch (error) {
      console.error("Error cargando sucursales:", error);
    }
  };

  const handleApprove = async (deviceId) => {
    const sucursalId = selectedSucursal[deviceId];
    if (!sucursalId) {
      setMessage({ type: 'warning', text: 'Por favor, selecciona una sucursal para este dispositivo.' });
      return;
    }

    try {
      await axios.post('/api/devices/approve', { 
        id: deviceId, 
        sucursalId: sucursalId 
      });
      setMessage({ type: 'success', text: `Dispositivo ${deviceId} aprobado con éxito.` });
      setPendingDevices(prevDevices => prevDevices.filter(device => device.id !== deviceId));
    } catch (error) {
      console.error('Error al aprobar:', error);
      setMessage({ type: 'danger', text: 'Hubo un error al aprobar el dispositivo.' });
    }
  };

  const handleSelectChange = (deviceId, sucursalId) => {
    setSelectedSucursal(prev => ({ ...prev, [deviceId]: sucursalId }));
  };

  return (
    // Habilitamos el tema oscuro y la animación
    <div className="animate__animated animate__fadeIn" data-bs-theme="dark">
      <header className="pb-3 mb-4 border-bottom border-secondary">
        <h1 className="h3 text-white-50">Dashboard Principal</h1>
      </header>
      
      {message.text && (
        <Alert variant={message.type} onClose={() => setMessage({ type: '', text: '' })} dismissible className="d-flex align-items-center">
          {message.type === 'success' && <i className="bi bi-check-circle-fill me-2"></i>}
          {message.type === 'danger' && <i className="bi bi-exclamation-triangle-fill me-2"></i>}
          {message.type === 'warning' && <i className="bi bi-exclamation-triangle-fill me-2"></i>}
          {message.type === 'info' && <i className="bi bi-info-circle-fill me-2"></i>}
          {message.text}
        </Alert>
      )}

      {/* Tarjeta oscura con cabecera "vivita" */}
      <Card bg="dark" text="white" className="shadow-lg border-0" style={{ borderRadius: '1rem' }}>
        <Card.Header className="bg-primary text-white border-0" style={{ borderTopLeftRadius: '1rem', borderTopRightRadius: '1rem' }}>
          <h5 className="mb-0"><i className="bi bi-hdd-stack-fill me-2"></i>Solicitudes de Dispositivos Pendientes</h5>
        </Card.Header>
        <Card.Body className="p-0"> {/* Padding 0 para que la lista ocupe todo */}
          {pendingDevices.length > 0 ? (
            <ListGroup variant="flush">
              {pendingDevices.map((device, index) => (
                <ListGroup.Item key={device.id} className="bg-dark text-white d-flex flex-column flex-md-row justify-content-between align-items-md-center p-3"
                  // Sin borde superior en el primer ítem para que pegue con la cabecera
                  style={ index === 0 ? { borderTop: 'none' } : {}}
                >
                  <div className="mb-2 mb-md-0">
                    <span className="fw-bold"><i className="bi bi-tablet-landscape me-2 text-primary"></i>Dispositivo ID: {device.id}</span>
                    <br />
                    <span className="text-white-50 small font-monospace">{device.fingerprint}</span>
                  </div>
                  <div className="d-flex w-100 w-md-auto">
                    <Form.Select 
                      size="sm"
                      className="me-2" 
                      onChange={(e) => handleSelectChange(device.id, e.target.value)}
                      value={selectedSucursal[device.id] || ''}
                    >
                      <option value="">Asignar a...</option>
                      {sucursales.map(s => (
                        <option key={s.id} value={s.id}>{s.nombre}</option>
                      ))}
                    </Form.Select>
                    <Button variant="outline-success" size="sm" onClick={() => handleApprove(device.id)}>
                      <i className="bi bi-check-lg"></i> Aprobar
                    </Button>
                  </div>
                </ListGroup.Item>
              ))}
            </ListGroup>
          ) : (
            <p className="text-white-50 p-4 text-center">No hay dispositivos pendientes de aprobación.</p>
          )}
        </Card.Body>
      </Card>
    </div>
  );
}

// --- Componente principal de la App ---
function App() {
  return (
    <Router>
      <Routes>
        {/* --- RUTAS PÚBLICAS --- */}
        <Route path="/" element={<Kiosk />} />
        <Route path="/kiosk" element={<Kiosk />} />
        <Route path="/login-admin" element={<LoginAdmin />} />

        {/* --- RUTAS PROTEGIDAS --- */}
        <Route element={<ProtectedRoute />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="registros" element={<RegistrosAdmin />} />
            <Route path="nuevo-registro" element={<NuevoRegistro />} />
            <Route path="puestos" element={<PuestosAdmin />} />
            <Route path="sucursales" element={<SucursalesAdmin />} />
            <Route path="bonos" element={<BonosAdmin />} />
          </Route>
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
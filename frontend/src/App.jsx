// frontend/src/App.jsx
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import axios from 'axios';
import io from 'socket.io-client';

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
// Se conecta al mismo dominio (funciona en local y en producción)
const socket = io();

// ==========================================================
//  DASHBOARD CON LÓGICA DE APROBACIÓN
// ==========================================================
function AdminDashboard() {
  const [pendingDevices, setPendingDevices] = useState([]);
  const [sucursales, setSucursales] = useState([]);
  const [selectedSucursal, setSelectedSucursal] = useState({});
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchPendingDevices();
    fetchSucursales();

    socket.on('new_device_request', (newDevice) => {
      setPendingDevices(prevDevices => [newDevice, ...prevDevices]);
      setMessage('¡Ha llegado una nueva solicitud de dispositivo!');
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
      setMessage('Por favor, selecciona una sucursal para este dispositivo.');
      return;
    }

    try {
      await axios.post('/api/devices/approve', { 
        id: deviceId, 
        sucursalId: sucursalId 
      });
      setMessage(`Dispositivo ${deviceId} aprobado con éxito.`);
      setPendingDevices(prevDevices => prevDevices.filter(device => device.id !== deviceId));
    } catch (error) {
      console.error('Error al aprobar:', error);
      setMessage('Hubo un error al aprobar el dispositivo.');
    }
  };

  const handleSelectChange = (deviceId, sucursalId) => {
    setSelectedSucursal(prev => ({ ...prev, [deviceId]: sucursalId }));
  };

  return (
    <div>
      <header className="pb-3 mb-4 border-bottom">
        <h1 className="h3">Dashboard Principal</h1>
      </header>
      
      {message && <div className="alert alert-info">{message}</div>}

      <div className="card">
        <div className="card-header">
          <h5 className="card-title mb-0">Solicitudes de Dispositivos Pendientes</h5>
        </div>
        <div className="card-body">
          {pendingDevices.length > 0 ? (
            <ul className="list-group">
              {pendingDevices.map((device) => (
                <li key={device.id} className="list-group-item d-flex flex-column flex-md-row justify-content-between align-items-md-center">
                  <div className="mb-2 mb-md-0">
                    <span className="fw-bold">Dispositivo ID: {device.id}</span>
                    <br />
                    <span className="text-muted small">Código: {device.fingerprint}</span>
                  </div>
                  <div className="d-flex w-100 w-md-auto">
                    <select 
                      className="form-select form-select-sm me-2" 
                      onChange={(e) => handleSelectChange(device.id, e.target.value)}
                      value={selectedSucursal[device.id] || ''}
                    >
                      <option value="">Asignar a...</option>
                      {sucursales.map(s => (
                        <option key={s.id} value={s.id}>{s.nombre}</option>
                      ))}
                    </select>
                    <button className="btn btn-sm btn-outline-success" onClick={() => handleApprove(device.id)}>
                      Aprobar
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted">No hay dispositivos pendientes de aprobación.</p>
          )}
        </div>
      </div>
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
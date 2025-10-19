// frontend/src/App.jsx
import React, { useState, useEffect } from 'react'; // <-- IMPORTS ADICIONALES
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import axios from 'axios'; // <-- IMPORTS ADICIONALES
import io from 'socket.io-client'; // <-- IMPORTS ADICIONALES

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

// --- CONFIGURACIÓN PARA TIEMPO REAL ---
const socket = io();

// ==========================================================
//  NUEVO DASHBOARD CON LÓGICA DE APROBACIÓN
// ==========================================================
function AdminDashboard() {
  const [pendingDevices, setPendingDevices] = useState([]);
  const [message, setMessage] = useState('');

  // Cargar dispositivos al iniciar y escuchar por nuevos en tiempo real
  useEffect(() => {
    fetchPendingDevices();

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

  const handleApprove = async (deviceId) => {
    try {
      await axios.post('/api/devices/approve', { id: deviceId });
      setMessage(`Dispositivo ${deviceId} aprobado con éxito.`);
      setPendingDevices(prevDevices => prevDevices.filter(device => device.id !== deviceId));
    } catch (error) {
      console.error('Error al aprobar:', error);
      setMessage('Hubo un error al aprobar el dispositivo.');
    }
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
                <li key={device.id} className="list-group-item d-flex justify-content-between align-items-center">
                  <div>
                    <span className="fw-bold">Dispositivo ID: {device.id}</span>
                    <br />
                    <span className="text-muted small">Código: {device.fingerprint}</span>
                  </div>
                  <button className="btn btn-sm btn-outline-success" onClick={() => handleApprove(device.id)}>
                    Aprobar
                  </button>
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

// --- El resto de tu componente App se queda igual ---
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
            <Route index element={<AdminDashboard />} /> {/* <-- Esta ruta ahora muestra el nuevo dashboard */}
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
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Card } from 'react-bootstrap'; 
import 'animate.css'; 

import Kiosk from './Kiosk';
import AdminLayout from './AdminLayout';
import ProtectedRoute from './ProtectedRoute';
import LoginAdmin from './pages/LoginAdmin';
import NuevoRegistro from './pages/NuevoRegistro';
import PuestosAdmin from './pages/PuestosAdmin';
import SucursalesAdmin from './pages/SucursalesAdmin';
import BonosAdmin from './pages/BonosAdmin';
import DispositivosAdmin from './pages/DispositivosAdmin'; 
import GestionEmpleados from './pages/GestionEmpleados';
import RegistrosAdmin from './pages/RegistrosAdmin';
import DiasFestivosAdmin from './pages/DiasFestivosAdmin';
import DiasDescansoAdmin from './pages/DiasDescansoAdmin';
import VacacionesAdmin from './pages/VacacionesAdmin';
import PermisosAdmin from './pages/PermisosAdmin';
import AdministradoresAdmin from './pages/AdministradoresAdmin';
import IncidentesNomina from './pages/IncidentesNomina'; // <-- NUEVA IMPORTACIÓN
import NominasAdmin from './pages/NominasAdmin'; // <-- NUEVA IMPORTACIÓN

function AdminDashboard() {
  return (
    <div className="animate__animated animate__fadeIn" data-bs-theme="dark">
      <header className="pb-3 mb-4 border-bottom border-secondary">
        <h1 className="h3 text-white-50">Dashboard Principal</h1>
      </header>
      <Card bg="dark" text="white" className="shadow-lg border-0" style={{ borderRadius: '1rem' }}>
        <Card.Body className="p-5 text-center">
          <i className="bi bi-person-workspace display-3 text-primary"></i>
          <h2 className="mt-3">¡Bienvenido, Admin!</h2>
          <p className="lead text-white-50">Selecciona una opción del menú lateral para comenzar a gestionar el sistema.</p>
        </Card.Body>
      </Card>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Kiosk />} />
        <Route path="/kiosk" element={<Kiosk />} />
        <Route path="/login-admin" element={<LoginAdmin />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="registros" element={<RegistrosAdmin />} />
            <Route path="nuevo-registro" element={<NuevoRegistro />} />
            <Route path="gestionar-empleados" element={<GestionEmpleados />} />
            <Route path="puestos" element={<PuestosAdmin />} />
            <Route path="sucursales" element={<SucursalesAdmin />} />
            <Route path="bonos" element={<BonosAdmin />} />
            <Route path="dispositivos" element={<DispositivosAdmin />} />
            <Route path="dias-descanso" element={<DiasDescansoAdmin />} />
            <Route path="vacaciones" element={<VacacionesAdmin />} />
            <Route path="permisos" element={<PermisosAdmin />} />
            <Route path="dias-festivos" element={<DiasFestivosAdmin />} />
            <Route path="administradores" element={<AdministradoresAdmin />} />
            <Route path="incidentes-nomina" element={<IncidentesNomina />} /> {/* <-- NUEVA RUTA */}
            <Route path="nominas" element={<NominasAdmin />} /> {/* <-- NUEVA RUTA */}
          </Route>
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
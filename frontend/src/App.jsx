import { Routes, Route, Navigate } from 'react-router-dom';

// Public Pages
import { CheckIn } from './pages/CheckIn';
import { DevicePending } from './pages/DevicePending';
import { PortalEmpleado } from './pages/PortalEmpleado';
import { AdminLogin } from './pages/Admin/Login';


// Admin Pages
import { AdminDashboard } from './pages/Admin/Dashboard';
import { AdminEmpleados } from './pages/Admin/Empleados';
import { AdminTurnos } from './pages/Admin/Turnos';
import { AdminSucursales } from './pages/Admin/Sucursales';
import { AdminPuestos } from './pages/Admin/Puestos';
import { AdminNomina } from './pages/Admin/Nomina';
import { AdminRegistros } from './pages/Admin/Registros';
import { AdminFestivos } from './pages/Admin/Festivos';
import { AdminAusencias } from './pages/Admin/Ausencias';
import { AdminDispositivos } from './pages/Admin/Dispositivos';
import { AuthProvider } from './context/AuthContext';
import { DeviceProvider } from './context/DeviceContext';

// Components & Layouts
import { AdminLayout } from './layouts/AdminLayout';
import { PrivateRoute } from './components/PrivateRoute';
import { DeviceCheck } from './components/DeviceCheck';

function App() {
    return (
      <AuthProvider>
        <DeviceProvider>
          <Routes>
            {/* Rutas de Dispositivo (Públicas, pero con DeviceCheck) */}
            <Route path="/" element={<DeviceCheck><CheckIn /></DeviceCheck>} />
            <Route path="/portal" element={<DeviceCheck><PortalEmpleado /></DeviceCheck>} />
            <Route path="/pending" element={<DevicePending />} />

            {/* Rutas de Administración */}
            <Route path="/admin/login" element={<DeviceCheck><AdminLogin /></DeviceCheck>} />

            <Route path="/admin" element={<DeviceCheck><PrivateRoute><AdminLayout /></PrivateRoute></DeviceCheck>}>
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="empleados" element={<AdminEmpleados />} />
                <Route path="turnos" element={<AdminTurnos />} />
                <Route path="sucursales" element={<AdminSucursales />} />
                <Route path="dispositivos" element={<AdminDispositivos />} />
                <Route path="puestos" element={<AdminPuestos />} />
                <Route path="nomina" element={<AdminNomina />} />
                <Route path="registros" element={<AdminRegistros />} />
                <Route path="festivos" element={<AdminFestivos />} />
                <Route path="ausencias" element={<AdminAusencias />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={
              <div className="flex h-screen flex-col items-center justify-center bg-slate-950 text-white">
                <h1 className="text-4xl font-bold text-rose-500">404</h1>
                <p className="mt-2 text-slate-400">Página no encontrada</p>
                <a href="/" className="mt-4 text-cyan-400 underline">Volver al inicio</a>
              </div>
            } />
          </Routes>
        </DeviceProvider>
      </AuthProvider>
    );
}

export default App;

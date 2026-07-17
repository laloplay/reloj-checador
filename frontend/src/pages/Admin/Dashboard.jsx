import { useEffect, useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import { Users, Smartphone, Clock, BarChart3, CheckCircle, AlertCircle } from 'lucide-react';
import api from '../../services/api';
import { AuthContext } from '../../context/AuthContext';

export function AdminDashboard() {
  const auth = useContext(AuthContext);
  const [resumen, setResumen] = useState({
    totalEmpleados: 0,
    dispositivosPendientes: 0,
    checadasHoy: 0,
    facialesPendientes: 0,
  });
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    cargarResumen();
  }, []);

  const cargarResumen = async () => {
    try {
      setCargando(true);
      const [empleadosRes, dispositivosRes, reporteDiaRes, facialesRes] = await Promise.all([
        api.get('/empleados'),
        api.get('/dispositivos'),
        api.get('/reportes/dia'),
        api.get('/empleados/pendientes-facial'),
      ]);

      const totalEmpleados = empleadosRes.data.filter(e => e.activo).length;
      const dispositivosPendientes = dispositivosRes.data.filter(
        d => d.estado === 'pendiente'
      ).length;
      const checadasHoy = reporteDiaRes.data.total_checadas || 0;
      const facialesPendientes = facialesRes.data.length || 0;

      setResumen({
        totalEmpleados,
        dispositivosPendientes,
        checadasHoy,
        facialesPendientes,
      });
    } catch (error) {
      console.error('Error al cargar resumen:', error);
    } finally {
      setCargando(false);
    }
  };

  if (cargando) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-neutral-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400 tracking-wide">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Saludo */}
        <div className="mb-12">
          <h1 className="text-5xl font-light text-white tracking-wide">
            Bienvenido, <span className="font-semibold">{auth.admin?.username}</span>
          </h1>
          <p className="text-gray-400 text-sm mt-2">Panel de control de Reloj Checador</p>
        </div>

        {/* Cards de resumen */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          {/* Empleados activos */}
          <div className="bg-neutral-900 border border-blue-900/30 rounded-lg p-6 hover:border-blue-600/50 transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm uppercase tracking-wide">Empleados activos</p>
                <p className="text-4xl font-light text-blue-400 mt-3">
                  {resumen.totalEmpleados}
                </p>
              </div>
              <Users className="text-blue-500 opacity-20" size={56} />
            </div>
          </div>

          {/* Dispositivos pendientes */}
          <div
            className={`rounded-lg p-6 transition border ${
              resumen.dispositivosPendientes > 0
                ? 'bg-red-900/20 border-red-600/50 hover:border-red-500'
                : 'bg-neutral-900 border-green-900/30 hover:border-green-600/50'
            }`}
          >
            <div className="flex items-center justify-between relative">
              <div>
                <p className="text-gray-400 text-sm uppercase tracking-wide">Dispositivos pendientes</p>
                <p
                  className={`text-4xl font-light mt-3 ${
                    resumen.dispositivosPendientes > 0 ? 'text-red-400' : 'text-green-400'
                  }`}
                >
                  {resumen.dispositivosPendientes}
                </p>
              </div>
              <div className="relative">
                {resumen.dispositivosPendientes > 0 && (
                  <div className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center">
                    {resumen.dispositivosPendientes}
                  </div>
                )}
                <Smartphone
                  className={`opacity-20 ${
                    resumen.dispositivosPendientes > 0 ? 'text-red-500' : 'text-green-500'
                  }`}
                  size={56}
                />
              </div>
            </div>
            {resumen.dispositivosPendientes > 0 && (
              <div className="mt-4 p-3 bg-red-900/30 border border-red-600/30 rounded flex items-center gap-2 text-red-400 text-sm">
                <AlertCircle size={16} />
                <span>Requiere aprobación</span>
              </div>
            )}
          </div>

          {/* Checadas hoy */}
          <div className="bg-neutral-900 border border-green-900/30 rounded-lg p-6 hover:border-green-600/50 transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm uppercase tracking-wide">Checadas hoy</p>
                <p className="text-4xl font-light text-green-400 mt-3">
                  {resumen.checadasHoy}
                </p>
              </div>
              <CheckCircle className="text-green-500 opacity-20" size={56} />
            </div>
          </div>

          <div
            className={`rounded-lg p-6 transition border ${
              resumen.facialesPendientes > 0
                ? 'bg-rose-900/20 border-rose-600/50 hover:border-rose-500'
                : 'bg-neutral-900 border-neutral-800 hover:border-neutral-700'
            }`}
          >
            <div className="flex items-center justify-between relative">
              <div>
                <p className="text-gray-400 text-sm uppercase tracking-wide">Faciales pendientes</p>
                <p className={`text-4xl font-light mt-3 ${resumen.facialesPendientes > 0 ? 'text-rose-400' : 'text-gray-400'}`}>
                  {resumen.facialesPendientes}
                </p>
              </div>
              <AlertCircle className={`opacity-20 ${resumen.facialesPendientes > 0 ? 'text-rose-500' : 'text-gray-500'}`} size={56} />
            </div>
            {resumen.facialesPendientes > 0 && (
              <div className="mt-4 p-3 bg-rose-900/30 border border-rose-600/30 rounded flex items-center gap-2 text-rose-300 text-sm">
                <AlertCircle size={16} />
                <span>Hay empleados que deben completar su registro facial</span>
              </div>
            )}
          </div>
        </div>

        {/* Accesos rápidos */}
        <div className="mb-12">
          <h2 className="text-2xl font-light text-white tracking-wide mb-6">Accesos rápidos</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Empleados */}
            <Link
              to="/admin/empleados"
              className="bg-neutral-900 border border-blue-900/30 rounded-lg p-6 hover:border-blue-600 hover:bg-blue-900/10 transition group"
            >
              <div className="flex flex-col items-center text-center">
                <Users className="text-blue-400 group-hover:text-blue-300 mb-3" size={32} />
                <h3 className="text-white font-medium">Empleados</h3>
                <p className="text-gray-500 text-xs mt-1">Gestionar equipo</p>
              </div>
            </Link>

            {/* Dispositivos */}
            <Link
              to="/admin/dispositivos"
              className={`rounded-lg p-6 transition group border ${
                resumen.dispositivosPendientes > 0
                  ? 'bg-red-900/10 border-red-600/30 hover:border-red-500'
                  : 'bg-neutral-900 border-green-900/30 hover:border-green-600'
              }`}
            >
              <div className="flex flex-col items-center text-center relative">
                {resumen.dispositivosPendientes > 0 && (
                  <div className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    {resumen.dispositivosPendientes}
                  </div>
                )}
                <Smartphone
                  className={`mb-3 ${
                    resumen.dispositivosPendientes > 0
                      ? 'text-red-400 group-hover:text-red-300'
                      : 'text-green-400 group-hover:text-green-300'
                  }`}
                  size={32}
                />
                <h3 className="text-white font-medium">Dispositivos</h3>
                <p className="text-gray-500 text-xs mt-1">Aprobar/Rechazar</p>
              </div>
            </Link>

            {/* Turnos */}
            <Link
              to="/admin/turnos"
              className="bg-neutral-900 border border-amber-900/30 rounded-lg p-6 hover:border-amber-600 hover:bg-amber-900/10 transition group"
            >
              <div className="flex flex-col items-center text-center">
                <Clock className="text-amber-400 group-hover:text-amber-300 mb-3" size={32} />
                <h3 className="text-white font-medium">Turnos</h3>
                <p className="text-gray-500 text-xs mt-1">Configurar turnos</p>
              </div>
            </Link>

            {/* Reportes */}
            <Link
              to="/admin/reportes"
              className="bg-neutral-900 border border-purple-900/30 rounded-lg p-6 hover:border-purple-600 hover:bg-purple-900/10 transition group"
            >
              <div className="flex flex-col items-center text-center">
                <BarChart3 className="text-purple-400 group-hover:text-purple-300 mb-3" size={32} />
                <h3 className="text-white font-medium">Reportes</h3>
                <p className="text-gray-500 text-xs mt-1">Ver estadísticas</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { Calendar, ClipboardList, TrendingUp, UserRound, Building2, Clock3 } from 'lucide-react';
import api from '../../services/api';

const getMonthStart = () => {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString().split('T')[0];
};

const getToday = () => new Date().toISOString().split('T')[0];

export function AdminRegistros() {
  const [sucursales, setSucursales] = useState([]);
  const [empleados, setEmpleados] = useState([]);
  const [registros, setRegistros] = useState([]);
  const [estadisticas, setEstadisticas] = useState(null);
  const [sucursalFiltro, setSucursalFiltro] = useState('');
  const [empleadoFiltro, setEmpleadoFiltro] = useState('');
  const [fechaInicio, setFechaInicio] = useState(getMonthStart());
  const [fechaFin, setFechaFin] = useState(getToday());
  const [cargando, setCargando] = useState(true);
  const [cargandoConsulta, setCargandoConsulta] = useState(false);

  useEffect(() => {
    const cargarCatalogos = async () => {
      try {
        const [sucursalesRes, empleadosRes] = await Promise.all([
          api.get('/sucursales'),
          api.get('/empleados'),
        ]);

        setSucursales(sucursalesRes.data);
        setEmpleados(empleadosRes.data);
      } catch (error) {
        console.error('Error al cargar catálogos de registros:', error);
      } finally {
        setCargando(false);
      }
    };

    cargarCatalogos();
  }, []);

  useEffect(() => {
    if (!cargando) {
      cargarRegistros();
    }
  }, [sucursalFiltro, empleadoFiltro, fechaInicio, fechaFin, cargando]);

  const cargarRegistros = async () => {
    try {
      setCargandoConsulta(true);

      const params = new URLSearchParams();
      if (sucursalFiltro) {
        params.append('sucursal_id', sucursalFiltro);
      }
      if (empleadoFiltro) {
        params.append('empleado_id', empleadoFiltro);
      }
      if (fechaInicio) {
        params.append('fecha_inicio', fechaInicio);
      }
      if (fechaFin) {
        params.append('fecha_fin', fechaFin);
      }

      const [registrosRes, estadisticasRes] = await Promise.all([
        api.get(`/registros?${params.toString()}`),
        empleadoFiltro
          ? api.get(`/registros/estadisticas/${empleadoFiltro}?${params.toString()}`)
          : Promise.resolve({ data: null }),
      ]);

      setRegistros(registrosRes.data);
      setEstadisticas(estadisticasRes.data);
    } catch (error) {
      console.error('Error al cargar registros:', error);
    } finally {
      setCargandoConsulta(false);
    }
  };

  const empleadosFiltrados = sucursalFiltro
    ? empleados.filter((empleado) => empleado.sucursal_id === sucursalFiltro)
    : empleados;

  const empleadoSeleccionado = empleados.find((empleado) => empleado.id === empleadoFiltro);

  const formatearFecha = (timestamp) => new Date(timestamp).toLocaleString('es-ES', {
    dateStyle: 'short',
    timeStyle: 'short',
  });

  const periodoTexto = `${fechaInicio || 'inicio'} → ${fechaFin || 'fin'}`;

  if (cargando) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-neutral-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400 tracking-wide">Cargando registros...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-12">
          <h1 className="text-4xl font-light text-white tracking-wide">Registros</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-linear-to-br from-neutral-900 to-neutral-800 border border-blue-900/30 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm uppercase tracking-wide">Registros</p>
                <p className="text-4xl font-light text-white mt-2">{registros.length}</p>
              </div>
              <ClipboardList className="text-blue-500 opacity-20" size={48} />
            </div>
          </div>

          <div className="bg-linear-to-br from-neutral-900 to-neutral-800 border border-green-900/30 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm uppercase tracking-wide">Entradas</p>
                <p className="text-4xl font-light text-green-400 mt-2">{estadisticas?.total_entradas || 0}</p>
              </div>
              <TrendingUp className="text-green-500 opacity-20" size={48} />
            </div>
          </div>

          <div className="bg-linear-to-br from-neutral-900 to-neutral-800 border border-amber-900/30 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm uppercase tracking-wide">Retardos</p>
                <p className="text-4xl font-light text-amber-400 mt-2">{estadisticas?.total_retardos || 0}</p>
              </div>
              <Clock3 className="text-amber-500 opacity-20" size={48} />
            </div>
          </div>
        </div>

        <div className="bg-neutral-900 border border-blue-900/30 rounded-lg p-8 mb-12">
          <h2 className="text-2xl font-light text-white tracking-wide mb-6">Filtros</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">Sucursal</label>
              <select
                value={sucursalFiltro}
                onChange={(e) => {
                  setSucursalFiltro(e.target.value);
                  setEmpleadoFiltro('');
                }}
                className="w-full px-4 py-2 bg-neutral-800 border border-blue-900/40 rounded-lg text-white focus:outline-none focus:border-blue-600 transition"
              >
                <option value="">Todas las sucursales</option>
                {sucursales.map((sucursal) => (
                  <option key={sucursal.id} value={sucursal.id}>{sucursal.nombre}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">Empleado</label>
              <select
                value={empleadoFiltro}
                onChange={(e) => setEmpleadoFiltro(e.target.value)}
                className="w-full px-4 py-2 bg-neutral-800 border border-blue-900/40 rounded-lg text-white focus:outline-none focus:border-blue-600 transition"
              >
                <option value="">Todos los empleados</option>
                {empleadosFiltrados.map((empleado) => (
                  <option key={empleado.id} value={empleado.id}>{empleado.nombre_completo}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">Fecha inicio</label>
              <input
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                className="w-full px-4 py-2 bg-neutral-800 border border-blue-900/40 rounded-lg text-white focus:outline-none focus:border-blue-600 transition"
              />
            </div>

            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">Fecha fin</label>
              <input
                type="date"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
                className="w-full px-4 py-2 bg-neutral-800 border border-blue-900/40 rounded-lg text-white focus:outline-none focus:border-blue-600 transition"
              />
            </div>
          </div>

          <div className="mt-6 flex items-center gap-4 text-sm text-gray-400">
            <span className="inline-flex items-center gap-2"><Calendar size={16} /> {periodoTexto}</span>
            <span className="inline-flex items-center gap-2"><Building2 size={16} /> {sucursalFiltro ? 'Sucursal filtrada' : 'Todas las sucursales'}</span>
            <span className="inline-flex items-center gap-2"><UserRound size={16} /> {empleadoFiltro ? 'Empleado seleccionado' : 'Todos los empleados'}</span>
          </div>
        </div>

        <div className="bg-neutral-900 border border-blue-900/30 rounded-lg p-8 mb-12">
          <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
            <div>
              <h2 className="text-2xl font-light text-white tracking-wide">Estadísticas del empleado</h2>
              <p className="text-gray-400 text-sm mt-1">
                {empleadoSeleccionado ? empleadoSeleccionado.nombre_completo : 'Selecciona un empleado para ver sus métricas del período'}
              </p>
            </div>
            {cargandoConsulta && <p className="text-gray-400 text-sm">Actualizando...</p>}
          </div>

          {empleadoFiltro ? (
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="rounded-lg border border-green-900/30 bg-green-950/20 p-5">
                <p className="text-gray-400 text-xs uppercase tracking-wide">Entradas</p>
                <p className="text-3xl font-light text-green-400 mt-2">{estadisticas?.total_entradas || 0}</p>
              </div>
              <div className="rounded-lg border border-amber-900/30 bg-amber-950/20 p-5">
                <p className="text-gray-400 text-xs uppercase tracking-wide">Salidas</p>
                <p className="text-3xl font-light text-amber-400 mt-2">{estadisticas?.total_salidas || 0}</p>
              </div>
              <div className="rounded-lg border border-red-900/30 bg-red-950/20 p-5">
                <p className="text-gray-400 text-xs uppercase tracking-wide">Retardos</p>
                <p className="text-3xl font-light text-red-400 mt-2">{estadisticas?.total_retardos || 0}</p>
              </div>
              <div className="rounded-lg border border-blue-900/30 bg-blue-950/20 p-5">
                <p className="text-gray-400 text-xs uppercase tracking-wide">Bonos</p>
                <p className="text-3xl font-light text-blue-400 mt-2">{estadisticas?.total_bonos || 0}</p>
              </div>
              <div className="rounded-lg border border-neutral-700 bg-neutral-800/40 p-5">
                <p className="text-gray-400 text-xs uppercase tracking-wide">Faltas</p>
                <p className="text-3xl font-light text-white mt-2">{estadisticas?.total_faltas || 0}</p>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-blue-900/30 bg-neutral-950/50 p-8 text-center text-gray-400">
              Selecciona un empleado para mostrar las estadísticas de su período.
            </div>
          )}
        </div>

        <div className="bg-neutral-900 border border-blue-900/30 rounded-lg p-8">
          <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
            <div>
              <h2 className="text-2xl font-light text-white tracking-wide">Checadas</h2>
              <p className="text-gray-400 text-sm mt-1">Listado detallado de registros filtrados</p>
            </div>
            <p className="text-gray-400 text-sm">{registros.length} resultados</p>
          </div>

          <div className="overflow-x-auto">
            {registros.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                No hay registros para los filtros seleccionados.
              </div>
            ) : (
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-blue-900/20">
                    <th className="text-left py-3 px-4 text-gray-300 font-medium text-sm uppercase tracking-widest">Fecha/Hora</th>
                    <th className="text-left py-3 px-4 text-gray-300 font-medium text-sm uppercase tracking-widest">Empleado</th>
                    <th className="text-left py-3 px-4 text-gray-300 font-medium text-sm uppercase tracking-widest">Tipo</th>
                    <th className="text-left py-3 px-4 text-gray-300 font-medium text-sm uppercase tracking-widest">Bono</th>
                    <th className="text-left py-3 px-4 text-gray-300 font-medium text-sm uppercase tracking-widest">Retardo</th>
                    <th className="text-left py-3 px-4 text-gray-300 font-medium text-sm uppercase tracking-widest">Confianza</th>
                  </tr>
                </thead>
                <tbody>
                  {registros.map((registro) => (
                    <tr key={registro.id} className="border-b border-blue-900/10 hover:bg-blue-900/5 transition">
                      <td className="py-4 px-4 text-white font-medium whitespace-nowrap">{formatearFecha(registro.timestamp)}</td>
                      <td className="py-4 px-4 text-gray-300">
                        <div className="font-medium text-white">{registro.empleado_nombre_completo}</div>
                        <div className="text-xs text-gray-500">{registro.puesto_nombre || 'Sin puesto'}</div>
                      </td>
                      
                      <td className="py-4 px-4">
                        <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium border ${registro.tipo === 'entrada'
                          ? 'bg-green-900/30 text-green-400 border-green-600/30'
                          : 'bg-amber-900/30 text-amber-400 border-amber-600/30'
                        }`}>
                          {registro.tipo === 'entrada' ? 'Entrada' : 'Salida'}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-gray-400 text-sm">{registro.tiene_bono ? 'Sí' : 'No'}</td>
                      <td className="py-4 px-4 text-gray-400 text-sm">
                        {registro.es_retardo ? `Sí (${registro.minutos_diferencia || 0} min)` : 'No'}
                      </td>
                      <td className="py-4 px-4 text-gray-400 text-sm font-mono">
                        {registro.confianza_facial ? `${Number(registro.confianza_facial).toFixed(1)}%` : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
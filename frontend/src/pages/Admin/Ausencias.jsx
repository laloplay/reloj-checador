import { useEffect, useState } from 'react';
import { Plus, Edit, CheckCircle2, X, CalendarDays, UserRound } from 'lucide-react';
import api from '../../services/api';

const TIPOS = [
  { value: 'vacaciones', label: 'Vacaciones' },
  { value: 'permiso', label: 'Permiso' },
  { value: 'descanso', label: 'Descanso' },
];

const formatDate = (date) => new Date(date).toLocaleDateString('es-MX', {
  day: '2-digit',
  month: 'long',
  year: 'numeric',
});

export function AdminAusencias() {
  const [empleados, setEmpleados] = useState([]);
  const [ausencias, setAusencias] = useState([]);
  const [empleadoFiltro, setEmpleadoFiltro] = useState('');
  const [cargando, setCargando] = useState(true);
  const [cargandoConsulta, setCargandoConsulta] = useState(false);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [ausenciaEditando, setAusenciaEditando] = useState(null);
  const [formData, setFormData] = useState({
    empleado_id: '',
    tipo: 'vacaciones',
    fecha_inicio: '',
    fecha_fin: '',
    motivo: '',
    aprobado: false,
  });
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    cargarDatos();
  }, []);

  useEffect(() => {
    if (!cargando) {
      cargarAusencias();
    }
  }, [empleadoFiltro, cargando]);

  const cargarDatos = async () => {
    try {
      setCargando(true);
      const [empleadosRes, ausenciasRes] = await Promise.all([
        api.get('/empleados'),
        api.get('/ausencias'),
      ]);
      setEmpleados(empleadosRes.data);
      setAusencias(ausenciasRes.data);
    } catch (error) {
      console.error('Error al cargar ausencias:', error);
    } finally {
      setCargando(false);
    }
  };

  const cargarAusencias = async () => {
    try {
      setCargandoConsulta(true);
      const query = empleadoFiltro ? `?empleado_id=${empleadoFiltro}` : '';
      const res = await api.get(`/ausencias${query}`);
      setAusencias(res.data);
    } catch (error) {
      console.error('Error al filtrar ausencias:', error);
    } finally {
      setCargandoConsulta(false);
    }
  };

  const abrirModalCrear = () => {
    setAusenciaEditando(null);
    setFormData({
      empleado_id: empleadoFiltro || '',
      tipo: 'vacaciones',
      fecha_inicio: '',
      fecha_fin: '',
      motivo: '',
      aprobado: false,
    });
    setModalAbierto(true);
  };

  const abrirModalEditar = (ausencia) => {
    setAusenciaEditando(ausencia);
    setFormData({
      empleado_id: ausencia.empleado_id || '',
      tipo: ausencia.tipo || 'vacaciones',
      fecha_inicio: ausencia.fecha_inicio ? ausencia.fecha_inicio.split('T')[0] : '',
      fecha_fin: ausencia.fecha_fin ? ausencia.fecha_fin.split('T')[0] : '',
      motivo: ausencia.motivo || '',
      aprobado: ausencia.aprobado === true,
    });
    setModalAbierto(true);
  };

  const guardarAusencia = async (e) => {
    e.preventDefault();

    if (!formData.empleado_id || !formData.fecha_inicio || !formData.fecha_fin) {
      alert('Completa empleado, fecha de inicio y fecha de fin.');
      return;
    }

    try {
      setGuardando(true);
      if (ausenciaEditando) {
        await api.put(`/ausencias/${ausenciaEditando.id}`, formData);
      } else {
        await api.post('/ausencias', formData);
      }
      await cargarAusencias();
      setModalAbierto(false);
    } catch (error) {
      console.error('Error al guardar ausencia:', error);
      alert('Error al guardar la ausencia');
    } finally {
      setGuardando(false);
    }
  };

  const aprobarAusencia = async (ausencia) => {
    try {
      await api.put(`/ausencias/${ausencia.id}/aprobar`, { aprobado: !ausencia.aprobado });
      await cargarAusencias();
    } catch (error) {
      console.error('Error al aprobar ausencia:', error);
      alert('Error al cambiar el estado de aprobación');
    }
  };

  const eliminarAusencia = async (id) => {
    if (!window.confirm('¿Eliminar esta ausencia?')) return;

    try {
      await api.delete(`/ausencias/${id}`);
      await cargarAusencias();
    } catch (error) {
      console.error('Error al eliminar ausencia:', error);
      alert('Error al eliminar la ausencia');
    }
  };

  const empleadoSeleccionado = empleados.find((empleado) => empleado.id === empleadoFiltro);

  if (cargando) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-slate-950 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400 tracking-wide">Cargando ausencias...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.14),transparent_32%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.18),transparent_30%),radial-gradient(circle_at_bottom,rgba(15,23,42,0.96),rgba(2,6,23,1))]" />
      <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(rgba(255,255,255,0.9)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.9)_1px,transparent_1px)] bg-size-[36px_36px]" />
      <div className="relative mx-auto flex max-w-7xl flex-col gap-6 px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
        <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
            <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.28em] text-cyan-100">
                    <UserRound size={12} />
                    Gestión de personal
                </div>
                <h1 className="mt-3 text-3xl font-medium tracking-tight text-white sm:text-4xl">Ausencias</h1>
            </div>
            <button
                onClick={abrirModalCrear}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-600 px-4 py-3 text-sm font-medium text-white shadow-lg shadow-cyan-950/30 transition hover:bg-cyan-500 active:scale-[0.99] sm:w-auto"
            >
                <Plus size={18} />
                Nueva ausencia
            </button>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-[0_18px_60px_rgba(0,0,0,0.2)] backdrop-blur-xl sm:p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
            <div>
              <label className="block text-[11px] uppercase tracking-widest text-gray-500 font-medium mb-1.5">Filtrar por empleado</label>
              <select
                value={empleadoFiltro}
                onChange={(e) => setEmpleadoFiltro(e.target.value)}
                className="w-full px-3 py-2.5 bg-black/20 border border-white/5 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-400 focus:bg-white/10 shadow-inner transition"
              >
                <option value="">Todos los empleados</option>
                {empleados.map((empleado) => (
                  <option key={empleado.id} value={empleado.id}>{empleado.nombre_completo}</option>
                ))}
              </select>
            </div>
            <div className="text-sm text-gray-400">
              <span className="inline-flex items-center gap-2"><UserRound size={16} /> {empleadoSeleccionado ? empleadoSeleccionado.nombre_completo : 'Vista general'}</span>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-[0_18px_60px_rgba(0,0,0,0.2)] backdrop-blur-xl sm:p-6 mb-6">
          <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
            <div>
              <h2 className="text-2xl font-light text-white tracking-wide">Listado</h2>
              <p className="text-gray-400 text-sm mt-1">Registro de ausencias y su aprobación</p>
            </div>
            {cargandoConsulta && <p className="text-gray-400 text-sm">Actualizando...</p>}
          </div>

          <div className="overflow-x-auto">
            {ausencias.length === 0 ? (
              <div className="text-center py-12 text-gray-400">No hay ausencias registradas.</div>
            ) : (
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 px-4 text-gray-300 font-medium text-sm uppercase tracking-widest">Empleado</th>
                    <th className="text-left py-3 px-4 text-gray-300 font-medium text-sm uppercase tracking-widest">Tipo</th>
                    <th className="text-left py-3 px-4 text-gray-300 font-medium text-sm uppercase tracking-widest">Fechas</th>
                    <th className="text-left py-3 px-4 text-gray-300 font-medium text-sm uppercase tracking-widest">Motivo</th>
                    <th className="text-left py-3 px-4 text-gray-300 font-medium text-sm uppercase tracking-widest">Estado</th>
                    <th className="text-center py-3 px-4 text-gray-300 font-medium text-sm uppercase tracking-widest">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {ausencias.map((ausencia) => (
                    <tr key={ausencia.id} className="border-b border-white/10 hover:bg-cyan-500/5 transition">
                      <td className="py-4 px-4 text-white font-medium">{ausencia.empleado_nombre_completo || 'Sin empleado'}</td>
                      <td className="py-4 px-4">
                        <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium border ${ausencia.tipo === 'vacaciones'
                          ? 'bg-blue-900/30 text-blue-400 border-blue-600/30'
                          : ausencia.tipo === 'permiso'
                            ? 'bg-amber-900/30 text-amber-400 border-amber-600/30'
                            : 'bg-green-900/30 text-green-400 border-green-600/30'
                        }`}>
                          {TIPOS.find((tipo) => tipo.value === ausencia.tipo)?.label || ausencia.tipo}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-gray-300 text-sm whitespace-nowrap">
                        {formatDate(ausencia.fecha_inicio)} - {formatDate(ausencia.fecha_fin)}
                      </td>
                      <td className="py-4 px-4 text-gray-400 text-sm max-w-xs">
                        {ausencia.motivo || 'Sin motivo'}
                      </td>
                      <td className="py-4 px-4">
                        <button
                          onClick={() => aprobarAusencia(ausencia)}
                          className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium border transition ${ausencia.aprobado
                            ? 'bg-green-900/30 text-green-400 border-green-600/30'
                            : 'bg-gray-900/30 text-gray-400 border-gray-600/30'
                          }`}
                        >
                          <CheckCircle2 size={16} />
                          {ausencia.aprobado ? 'Aprobada' : 'Pendiente'}
                        </button>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex gap-2 justify-center">
                          <button
                            onClick={() => abrirModalEditar(ausencia)}
                            className="inline-flex items-center gap-1 px-3 py-2 bg-cyan-500/10 text-cyan-300 border border-cyan-400/20 rounded-xl hover:bg-cyan-500/20 transition text-sm"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => eliminarAusencia(ausencia.id)}
                            className="inline-flex items-center gap-1 px-3 py-2 bg-red-900/30 text-red-400 border border-red-600/30 rounded-xl hover:bg-red-900/50 transition text-sm"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {modalAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-3 backdrop-blur-md sm:p-4">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-[0_18px_60px_rgba(0,0,0,0.2)] backdrop-blur-xl sm:p-6 mb-6 max-w-lg w-full">
            <div className="flex items-center justify-between border-b border-white/10 px-5 pb-4 pt-5 sm:px-7 sm:pb-5 sm:pt-6">
            <div>
                <p className="text-[11px] uppercase tracking-widest text-gray-500 font-medium mb-0.5">Gestión de personal</p>
                <h2 className="text-lg font-light text-gray-100 tracking-wide m-0">
                    {ausenciaEditando ? 'Editar ausencia' : 'Nueva ausencia'}
                </h2>
            </div>
            <button
                onClick={() => setModalAbierto(false)}
                className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-gray-200 hover:bg-white/10 transition"
            >
                <X size={16} />
            </button>
        </div>

            <form onSubmit={guardarAusencia} className="flex flex-col max-h-[calc(100dvh-10rem)]">
          <div className="flex flex-col gap-4 px-5 py-5 sm:px-7 overflow-y-auto">
              <div>
                <label className="block text-[11px] uppercase tracking-widest text-gray-500 font-medium mb-1.5">Empleado</label>
                <select
                  value={formData.empleado_id}
                  onChange={(e) => setFormData({ ...formData, empleado_id: e.target.value })}
                  className="w-full px-3 py-2.5 bg-black/20 border border-white/5 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-400 focus:bg-white/10 shadow-inner transition"
                >
                  <option value="">Selecciona un empleado</option>
                  {empleados.map((empleado) => (
                    <option key={empleado.id} value={empleado.id}>{empleado.nombre_completo}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-widest text-gray-500 font-medium mb-1.5">Tipo</label>
                <select
                  value={formData.tipo}
                  onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                  className="w-full px-3 py-2.5 bg-black/20 border border-white/5 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-400 focus:bg-white/10 shadow-inner transition"
                >
                  {TIPOS.map((tipo) => (
                    <option key={tipo.value} value={tipo.value}>{tipo.label}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] uppercase tracking-widest text-gray-500 font-medium mb-1.5">Fecha inicio</label>
                  <input
                    type="date"
                    value={formData.fecha_inicio}
                    onChange={(e) => setFormData({ ...formData, fecha_inicio: e.target.value })}
                    className="w-full px-3 py-2.5 bg-black/20 border border-white/5 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-400 focus:bg-white/10 shadow-inner transition"
                  />
                </div>
                <div>
                  <label className="block text-[11px] uppercase tracking-widest text-gray-500 font-medium mb-1.5">Fecha fin</label>
                  <input
                    type="date"
                    value={formData.fecha_fin}
                    onChange={(e) => setFormData({ ...formData, fecha_fin: e.target.value })}
                    className="w-full px-3 py-2.5 bg-black/20 border border-white/5 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-400 focus:bg-white/10 shadow-inner transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-widest text-gray-500 font-medium mb-1.5">Motivo</label>
                <textarea
                  value={formData.motivo}
                  onChange={(e) => setFormData({ ...formData, motivo: e.target.value })}
                  rows="4"
                  className="w-full px-3 py-2.5 bg-black/20 border border-white/5 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-400 focus:bg-white/10 shadow-inner transition"
                />
              </div>

              <label className="flex items-center gap-3 px-3 py-2.5 bg-black/20 border border-white/5 rounded-xl shadow-inner cursor-pointer hover:border-cyan-400/30 transition">
                <input
                  type="checkbox"
                  checked={formData.aprobado}
                  onChange={(e) => setFormData({ ...formData, aprobado: e.target.checked })}
                  className="w-4 h-4 accent-blue-600"
                />
                <span className="text-sm text-gray-300">Aprobada</span>
              </label>

                        </div>
          <div className="flex gap-3 border-t border-white/10 px-5 pb-5 pt-4 sm:px-7 sm:pb-6">
            <button
                type="button"
                onClick={() => setModalAbierto(false)}
                className="flex-1 py-2.5 bg-white/5 border border-white/10 rounded-xl text-gray-300 text-sm font-medium hover:bg-white/10 transition"
            >
                Cancelar
            </button>
            <button
                type="submit"
                disabled={guardando}
                className="flex-1 py-2.5 bg-cyan-600 text-white text-sm font-medium rounded-xl hover:bg-cyan-500 shadow-lg shadow-cyan-900/20 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
                {guardando ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
          </div>
        </div>
      )}
    </div>
  );
}
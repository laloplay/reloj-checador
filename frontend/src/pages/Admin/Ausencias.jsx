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
      <div className="flex items-center justify-center min-h-screen bg-neutral-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400 tracking-wide">Cargando ausencias...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-12 gap-4 flex-wrap">
          <div>
            <h1 className="text-4xl font-light text-white tracking-wide">Ausencias</h1>
            <p className="text-gray-400 text-sm mt-2">Vacaciones, permisos y descansos del personal</p>
          </div>
          <button
            onClick={abrirModalCrear}
            className="inline-flex items-center gap-2 px-4 py-3 bg-linear-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-blue-800 transition"
          >
            <Plus size={20} />
            Nueva ausencia
          </button>
        </div>

        <div className="bg-neutral-900 border border-blue-900/30 rounded-lg p-8 mb-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">Filtrar por empleado</label>
              <select
                value={empleadoFiltro}
                onChange={(e) => setEmpleadoFiltro(e.target.value)}
                className="w-full px-4 py-2 bg-neutral-800 border border-blue-900/40 rounded-lg text-white focus:outline-none focus:border-blue-600 transition"
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

        <div className="bg-neutral-900 border border-blue-900/30 rounded-lg p-8">
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
                  <tr className="border-b border-blue-900/20">
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
                    <tr key={ausencia.id} className="border-b border-blue-900/10 hover:bg-blue-900/5 transition">
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
                            className="inline-flex items-center gap-1 px-3 py-2 bg-blue-900/30 text-blue-400 border border-blue-600/30 rounded-lg hover:bg-blue-900/50 transition text-sm"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => eliminarAusencia(ausencia.id)}
                            className="inline-flex items-center gap-1 px-3 py-2 bg-red-900/30 text-red-400 border border-red-600/30 rounded-lg hover:bg-red-900/50 transition text-sm"
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-neutral-900 border border-blue-900/30 rounded-lg p-8 max-w-lg w-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-light text-white tracking-wide">
                {ausenciaEditando ? 'Editar ausencia' : 'Nueva ausencia'}
              </h2>
              <button onClick={() => setModalAbierto(false)} className="text-gray-400 hover:text-gray-300">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={guardarAusencia} className="space-y-4">
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">Empleado</label>
                <select
                  value={formData.empleado_id}
                  onChange={(e) => setFormData({ ...formData, empleado_id: e.target.value })}
                  className="w-full px-4 py-2 bg-neutral-800 border border-blue-900/40 rounded-lg text-white focus:outline-none focus:border-blue-600 transition"
                >
                  <option value="">Selecciona un empleado</option>
                  {empleados.map((empleado) => (
                    <option key={empleado.id} value={empleado.id}>{empleado.nombre_completo}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">Tipo</label>
                <select
                  value={formData.tipo}
                  onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                  className="w-full px-4 py-2 bg-neutral-800 border border-blue-900/40 rounded-lg text-white focus:outline-none focus:border-blue-600 transition"
                >
                  {TIPOS.map((tipo) => (
                    <option key={tipo.value} value={tipo.value}>{tipo.label}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">Fecha inicio</label>
                  <input
                    type="date"
                    value={formData.fecha_inicio}
                    onChange={(e) => setFormData({ ...formData, fecha_inicio: e.target.value })}
                    className="w-full px-4 py-2 bg-neutral-800 border border-blue-900/40 rounded-lg text-white focus:outline-none focus:border-blue-600 transition"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">Fecha fin</label>
                  <input
                    type="date"
                    value={formData.fecha_fin}
                    onChange={(e) => setFormData({ ...formData, fecha_fin: e.target.value })}
                    className="w-full px-4 py-2 bg-neutral-800 border border-blue-900/40 rounded-lg text-white focus:outline-none focus:border-blue-600 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">Motivo</label>
                <textarea
                  value={formData.motivo}
                  onChange={(e) => setFormData({ ...formData, motivo: e.target.value })}
                  rows="4"
                  className="w-full px-4 py-2 bg-neutral-800 border border-blue-900/40 rounded-lg text-white focus:outline-none focus:border-blue-600 transition"
                />
              </div>

              <label className="flex items-center gap-3 px-4 py-3 bg-neutral-800 border border-blue-900/40 rounded-lg cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.aprobado}
                  onChange={(e) => setFormData({ ...formData, aprobado: e.target.checked })}
                  className="w-4 h-4 accent-blue-600"
                />
                <span className="text-sm text-gray-300">Aprobada</span>
              </label>

              <div className="flex gap-3 pt-6">
                <button
                  type="button"
                  onClick={() => setModalAbierto(false)}
                  className="flex-1 py-2 bg-neutral-800 text-gray-300 border border-neutral-700 rounded-lg hover:bg-neutral-700 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="flex-1 py-2 bg-linear-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition"
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
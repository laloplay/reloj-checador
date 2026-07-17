import { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, X, Power } from 'lucide-react';
import api from '../../services/api';

export function AdminTurnos() {
  const [turnos, setTurnos] = useState([]);
  const [sucursales, setSucursales] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [mostrarInactivos, setMostrarInactivos] = useState(false);
  const [turnoEditando, setTurnoEditando] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    hora_inicio: '',
    hora_fin: '',
    minutos_bono: '',
    sucursal_id: '',
    bono_activo: true,
    activo: true,
  });
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setCargando(true);
      const [turnosRes, sucursalesRes] = await Promise.all([
        api.get('/turnos'),
        api.get('/sucursales'),
      ]);
      setTurnos(turnosRes.data);
      setSucursales(sucursalesRes.data);
    } catch (error) {
      console.error('Error al cargar turnos:', error);
    } finally {
      setCargando(false);
    }
  };

  const abrirModalCrear = () => {
    setTurnoEditando(null);
    setFormData({ nombre: '', hora_inicio: '', hora_fin: '', minutos_bono: '', sucursal_id: '', bono_activo: true });
    setModalAbierto(true);
  };

  const abrirModalEditar = (turno) => {
    setTurnoEditando(turno);

    const [h, m] = turno.hora_inicio.split(':').map(Number);
    const duracion = parseFloat(turno.duracion_horas);
    const finTotalMinutos = h * 60 + m + duracion * 60;
    const finHora = Math.floor(finTotalMinutos / 60) % 24;
    const finMinutos = Math.round(finTotalMinutos % 60);
    const hora_fin = `${String(finHora).padStart(2, '0')}:${String(finMinutos).padStart(2, '0')}`;

    setFormData({
      nombre: turno.nombre,
      hora_inicio: turno.hora_inicio,
      hora_fin: hora_fin,
      minutos_bono: turno.minutos_bono,
      sucursal_id: turno.sucursal_id || '',
      bono_activo: turno.bono_activo !== false,
      activo: turno.activo !== false,
    });
    setModalAbierto(true);
  };

  const guardarTurno = async (e) => {
    e.preventDefault();

    if (!formData.nombre || !formData.hora_inicio || !formData.hora_fin || formData.minutos_bono === '') {
      alert('Por favor completa todos los campos');
      return;
    }

    try {
      setGuardando(true);

      if (turnoEditando) {
        await api.put(`/turnos/${turnoEditando.id}`, formData);
      } else {
        await api.post('/turnos', formData);
      }

      await cargarDatos();
      setModalAbierto(false);
    } catch (error) {
      console.error('Error al guardar turno:', error);
      alert('Error al guardar el turno');
    } finally {
      setGuardando(false);
    }
  };

  const eliminarTurno = async (id) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este turno?')) return;

    try {
      await api.delete(`/turnos/${id}`);
      await cargarDatos();
    } catch (error) {
      console.error('Error al eliminar turno:', error);
      alert('Error al eliminar el turno');
    }
  };

  const reactivarTurno = async (id) => {
    try {
      const turno = turnos.find(t => t.id === id);
      if (!turno) return;

      const [h, m] = turno.hora_inicio.split(':').map(Number);
      const duracion = parseFloat(turno.duracion_horas);
      const finTotalMinutos = h * 60 + m + duracion * 60;
      const finHora = Math.floor(finTotalMinutos / 60) % 24;
      const finMinutos = Math.round(finTotalMinutos % 60);
      const hora_fin = `${String(finHora).padStart(2, '0')}:${String(finMinutos).padStart(2, '0')}`;

      await api.put(`/turnos/${id}`, { ...turno, hora_fin, activo: true });
      await cargarDatos();
    } catch (error) {
      console.error('Error al reactivar turno:', error);
      alert('Error al reactivar el turno');
    }
  };

  const turnosFiltrados = mostrarInactivos
    ? turnos
    : turnos.filter(t => t.activo);

  if (cargando) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-neutral-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400 tracking-wide">Cargando turnos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-12">
          <div>
            <h1 className="text-4xl font-light text-white tracking-wide">Turnos</h1>
            <p className="text-gray-400 text-sm mt-2">Gestiona los turnos de trabajo</p>
          </div>
          <button
            onClick={abrirModalCrear}
            className="inline-flex items-center gap-2 px-4 py-3 bg-linear-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-blue-800 transition"
          >
            <Plus size={20} />
            Nuevo turno
          </button>
        </div>

        <div className="flex items-center gap-3 mb-6">
          <input
            type="checkbox"
            id="mostrarInactivos"
            checked={mostrarInactivos}
            onChange={(e) => setMostrarInactivos(e.target.checked)}
            className="w-4 h-4 accent-blue-600"
          />
          <label htmlFor="mostrarInactivos" className="text-gray-400 text-sm cursor-pointer">
            Mostrar turnos inactivos
          </label>
        </div>

        {turnosFiltrados.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 tracking-wide">No hay turnos registrados</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-blue-900/20">
                  <th className="text-left py-4 px-4 text-gray-300 font-medium text-sm uppercase tracking-widest">
                    Nombre
                  </th>
                  <th className="text-left py-4 px-4 text-gray-300 font-medium text-sm uppercase tracking-widest">
                    Horario
                  </th>
                  <th className="text-left py-4 px-4 text-gray-300 font-medium text-sm uppercase tracking-widest">
                    Sucursal
                  </th>
                  <th className="text-left py-4 px-4 text-gray-300 font-medium text-sm uppercase tracking-widest">
                    Bono
                  </th>
                  <th className="text-left py-4 px-4 text-gray-300 font-medium text-sm uppercase tracking-widest">
                    Minutos bono
                  </th>
                  <th className="text-left py-4 px-4 text-gray-300 font-medium text-sm uppercase tracking-widest">
                    Estado
                  </th>
                  <th className="text-center py-4 px-4 text-gray-300 font-medium text-sm uppercase tracking-widest">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {turnosFiltrados.map((turno) => {
                  const sucursal = sucursales.find((s) => s.id === turno.sucursal_id);
                  const [h, m] = turno.hora_inicio.split(':').map(Number);
                  const duracion = parseFloat(turno.duracion_horas);
                  const finTotalMinutos = h * 60 + m + duracion * 60;
                  const finHora = Math.floor(finTotalMinutos / 60) % 24;
                  const finMinutos = Math.round(finTotalMinutos % 60);
                  const hora_fin = `${String(finHora).padStart(2, '0')}:${String(finMinutos).padStart(2, '0')}`;

                  return (
                    <tr
                      key={turno.id}
                      className="border-b border-blue-900/10 hover:bg-blue-900/5 transition"
                    >
                      <td className="py-4 px-4 text-white font-medium">{turno.nombre}</td>
                      <td className="py-4 px-4 text-gray-400 font-mono text-sm">{`${turno.hora_inicio} → ${hora_fin}`}</td>
                      <td className="py-4 px-4 text-gray-400 text-sm">{sucursal?.nombre || 'Global'}</td>
                      <td className="py-4 px-4 text-gray-400 text-sm">
                        {turno.bono_activo ? (
                          <span className="text-green-400 font-semibold">✓ Sí</span>
                        ) : (
                          <span className="text-gray-500">✗ No</span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-gray-400 text-sm">{turno.minutos_bono} min</td>
                      <td className="py-4 px-4">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-sm font-medium border ${turno.activo
                              ? 'bg-green-900/30 text-green-400 border-green-600/30'
                              : 'bg-red-900/30 text-red-400 border-red-600/30'
                            }`}
                        >
                          {turno.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex gap-2 justify-center">
                          <button
                            onClick={() => abrirModalEditar(turno)}
                            className="inline-flex items-center gap-1 px-3 py-2 bg-blue-900/30 text-blue-400 border border-blue-600/30 rounded-lg hover:bg-blue-900/50 transition text-sm"
                          >
                            <Edit size={16} />
                          </button>
                          {turno.activo ? (
                            <button
                              onClick={() => eliminarTurno(turno.id)}
                              className="inline-flex items-center gap-1 px-3 py-2 bg-red-900/30 text-red-400 border border-red-600/30 rounded-lg hover:bg-red-900/50 transition text-sm"
                            >
                              <Trash2 size={16} />
                            </button>
                          ) : (
                            <button onClick={() => reactivarTurno(turno.id)}
                              className="inline-flex items-center gap-1 px-3 py-2 bg-green-900/30 text-green-400 border border-green-600/30 rounded-lg hover:bg-green-900/50 transition text-sm"
                            >
                              <Power size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalAbierto && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-neutral-900 border border-blue-900/30 rounded-lg p-8 max-w-md w-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-light text-white tracking-wide">
                {turnoEditando ? 'Editar turno' : 'Nuevo turno'}
              </h2>
              <button
                onClick={() => setModalAbierto(false)}
                className="text-gray-400 hover:text-gray-300"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={guardarTurno} className="space-y-4">
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">Nombre</label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  placeholder="ej: Matutino, Vespertino"
                  className="w-full px-4 py-2 bg-neutral-800 border border-blue-900/40 rounded-lg text-white focus:outline-none focus:border-blue-600 transition"
                />
              </div>

              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">Hora de inicio</label>
                <input
                  type="time"
                  value={formData.hora_inicio}
                  onChange={(e) => setFormData({ ...formData, hora_inicio: e.target.value })}
                  className="w-full px-4 py-2 bg-neutral-800 border border-blue-900/40 rounded-lg text-white focus:outline-none focus:border-blue-600 transition"
                />
              </div>

              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">Hora de fin</label>
                <input
                  type="time"
                  value={formData.hora_fin}
                  onChange={(e) => setFormData({ ...formData, hora_fin: e.target.value })}
                  className="w-full px-4 py-2 bg-neutral-800 border border-blue-900/40 rounded-lg text-white focus:outline-none focus:border-blue-600 transition"
                />
              </div>

              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">Sucursal</label>
                <select
                  value={formData.sucursal_id}
                  onChange={(e) =>
                    setFormData({ ...formData, sucursal_id: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-neutral-800 border border-blue-900/40 rounded-lg text-white focus:outline-none focus:border-blue-600 transition"
                >
                  <option value="">Global (todas las sucursales)</option>
                  {sucursales.map((sucursal) => (
                    <option key={sucursal.id} value={sucursal.id}>
                      {sucursal.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">Minutos de bono</label>
                <input
                  type="number"
                  value={formData.minutos_bono}
                  onChange={(e) => setFormData({ ...formData, minutos_bono: e.target.value })}
                  placeholder="ej: 10"
                  className="w-full px-4 py-2 bg-neutral-800 border border-blue-900/40 rounded-lg text-white focus:outline-none focus:border-blue-600 transition"
                />
                <p className="text-gray-500 text-xs mt-2">
                  El empleado debe llegar con esta anticipación o más para ganar el bono de puntualidad.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="bono_activo"
                  checked={formData.bono_activo}
                  onChange={(e) => setFormData({ ...formData, bono_activo: e.target.checked })}
                  className="w-4 h-4 accent-blue-600"
                />
                <label htmlFor="bono_activo" className="text-gray-300 text-sm cursor-pointer">
                  Este turno aplica bono de puntualidad
                </label>
              </div>

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

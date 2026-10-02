import { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, X, Power, Clock } from 'lucide-react';
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
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.14),transparent_32%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.18),transparent_30%),radial-gradient(circle_at_bottom,rgba(15,23,42,0.96),rgba(2,6,23,1))]" />
      <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(rgba(255,255,255,0.9)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.9)_1px,transparent_1px)] bg-size-[36px_36px]" />
      <div className="relative mx-auto flex max-w-7xl flex-col gap-6 px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
        <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.28em] text-cyan-100">
                <Clock size={12} />
                Gestión de personal
            </div>
            <h1 className="mt-3 text-3xl font-medium tracking-tight text-white sm:text-4xl">Turnos</h1>
          </div>
          <button
            onClick={abrirModalCrear}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-600 px-4 py-3 text-sm font-medium text-white shadow-lg shadow-cyan-950/30 transition hover:bg-cyan-500 active:scale-[0.99] sm:w-auto"
          >
            <Plus size={18} />
            Nuevo turno
          </button>
        </div>

        <div className="flex items-center gap-3 mb-6">
          <input
            type="checkbox"
            id="mostrarInactivos"
            checked={mostrarInactivos}
            onChange={(e) => setMostrarInactivos(e.target.checked)}
            className="w-4 h-4 accent-cyan-500"
          />
          <label htmlFor="mostrarInactivos" className="text-gray-400 text-sm cursor-pointer">
            Mostrar turnos inactivos
          </label>
        </div>

        {turnosFiltrados.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-white/10 bg-white/3 px-6 py-16 text-center">
            <Clock className="mx-auto mb-4 text-slate-600" size={34} />
            <p className="font-medium text-slate-300">No hay turnos registrados</p>
            <p className="mt-1 text-sm text-slate-500">Agrega el primero para comenzar a gestionar los horarios.</p>
          </div>
        ) : (
        <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/4 shadow-[0_20px_60px_rgba(0,0,0,0.18)] backdrop-blur-xl">
          <div className="overflow-x-auto">
            <table className="w-full min-w-225 border-collapse">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="px-4 py-4 text-left text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Nombre
                  </th>
                  <th className="px-4 py-4 text-left text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Horario
                  </th>
                  <th className="px-4 py-4 text-left text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Sucursal
                  </th>
                  <th className="px-4 py-4 text-left text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Bono
                  </th>
                  <th className="px-4 py-4 text-left text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Minutos bono
                  </th>
                  <th className="px-4 py-4 text-left text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Estado
                  </th>
                  <th className="px-5 py-4 text-center text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
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
                      className="border-b border-white/5 transition hover:bg-cyan-500/4"
                    >
                      <td className="px-4 py-4 text-sm text-slate-400">
                      {turno.nombre}
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-400">
                      {`${turno.hora_inicio} → ${hora_fin}`}
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-400">
                      {sucursal?.nombre || 'Global'}
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-400">
                        {turno.bono_activo ? (
                          <span className="text-green-400 font-semibold">✓ Sí</span>
                        ) : (
                          <span className="text-gray-500">✗ No</span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-gray-400 text-sm">{turno.minutos_bono} min</td>
                      <td className="px-4 py-4 text-sm text-slate-400">
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
                            className="inline-flex items-center gap-1 px-3 py-2 bg-cyan-500/10 text-cyan-300 border border-cyan-400/20 rounded-xl hover:bg-cyan-500/20 transition text-sm"
                          >
                            <Edit size={16} />
                          </button>
                          {turno.activo ? (
                            <button
                              onClick={() => eliminarTurno(turno.id)}
                              className="inline-flex items-center gap-1 px-3 py-2 bg-red-900/30 text-red-400 border border-red-600/30 rounded-xl hover:bg-red-900/50 transition text-sm"
                            >
                              <Trash2 size={16} />
                            </button>
                          ) : (
                            <button onClick={() => reactivarTurno(turno.id)}
                              className="inline-flex items-center gap-1 px-3 py-2 bg-green-900/30 text-green-400 border border-green-600/30 rounded-xl hover:bg-green-900/50 transition text-sm"
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
        </div>
        )}
      </div>

      {modalAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-3 backdrop-blur-md sm:p-4">
          <div className="max-h-[calc(100dvh-1.5rem)] w-full max-w-md overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/[0.02] shadow-[0_24px_80px_rgba(0,0,0,0.5)] backdrop-blur-3xl flex flex-col">
            <div className="flex items-center justify-between border-b border-white/10 px-5 pb-4 pt-5 sm:px-7 sm:pb-5 sm:pt-6">
                            <div>
                                <p className="text-[11px] uppercase tracking-widest text-gray-500 font-medium mb-0.5">Gestión de personal</p>
                                <h2 className="text-lg font-light text-gray-100 tracking-wide m-0">
                {turnoEditando ? 'Editar turno' : 'Nuevo turno'}
              </h2>
                            </div>
                            <button
                                onClick={() => setModalAbierto(false)}
                                className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-gray-200 hover:bg-white/10 transition"
                            >
                                <X size={16} />
                            </button>
                        </div>

            <form onSubmit={guardarTurno} className="flex flex-col max-h-[calc(100dvh-10rem)]">
                            <div className="flex flex-col gap-4 px-5 py-5 sm:px-7 overflow-y-auto">
              <div>
                <label className="block text-[11px] uppercase tracking-widest text-gray-500 font-medium mb-1.5">Nombre</label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  placeholder="ej: Matutino, Vespertino"
                  className="w-full px-3 py-2.5 bg-black/20 border border-white/5 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-400 focus:bg-white/10 shadow-inner transition"
                />
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-widest text-gray-500 font-medium mb-1.5">Hora de inicio</label>
                <input
                  type="time"
                  value={formData.hora_inicio}
                  onChange={(e) => setFormData({ ...formData, hora_inicio: e.target.value })}
                  className="w-full px-3 py-2.5 bg-black/20 border border-white/5 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-400 focus:bg-white/10 shadow-inner transition"
                />
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-widest text-gray-500 font-medium mb-1.5">Hora de fin</label>
                <input
                  type="time"
                  value={formData.hora_fin}
                  onChange={(e) => setFormData({ ...formData, hora_fin: e.target.value })}
                  className="w-full px-3 py-2.5 bg-black/20 border border-white/5 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-400 focus:bg-white/10 shadow-inner transition"
                />
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-widest text-gray-500 font-medium mb-1.5">Sucursal</label>
                <select
                  value={formData.sucursal_id}
                  onChange={(e) =>
                    setFormData({ ...formData, sucursal_id: e.target.value })
                  }
                  className="w-full px-3 py-2.5 bg-black/20 border border-white/5 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-400 focus:bg-white/10 shadow-inner transition"
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
                <label className="block text-[11px] uppercase tracking-widest text-gray-500 font-medium mb-1.5">Minutos de bono</label>
                <input
                  type="number"
                  value={formData.minutos_bono}
                  onChange={(e) => setFormData({ ...formData, minutos_bono: e.target.value })}
                  placeholder="ej: 10"
                  className="w-full px-3 py-2.5 bg-black/20 border border-white/5 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-400 focus:bg-white/10 shadow-inner transition"
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
                  className="w-4 h-4 accent-cyan-500"
                />
                <label htmlFor="bono_activo" className="text-gray-300 text-sm cursor-pointer">
                  Este turno aplica bono de puntualidad
                </label>
              </div>

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

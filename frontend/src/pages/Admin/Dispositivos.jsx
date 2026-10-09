import { useEffect, useState } from 'react';
import { Check, X, Smartphone, AlertCircle, Pencil, Trash2, Save } from 'lucide-react';
import api from '../../services/api';

export function AdminDispositivos() {
  const [dispositivos, setDispositivos] = useState([]);
  const [sucursales, setSucursales] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [procesandoId, setProcesandoId] = useState(null);
  const [sucursalesSeleccionadas, setSucursalesSeleccionadas] = useState({});
  const [tiposSeleccionados, setTiposSeleccionados] = useState({});
  const [editando, setEditando] = useState(null);
  const [formularioEdicion, setFormularioEdicion] = useState({});

  const cargarDispositivos = async () => {
    try {
      setCargando(true);
      const [dispositivosRes, sucursalesRes] = await Promise.all([
        api.get('/dispositivos'),
        api.get('/sucursales'),
      ]);
      setDispositivos(dispositivosRes.data);
      setSucursales(sucursalesRes.data);
    } catch (error) {
      console.error('Error al cargar dispositivos:', error);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDispositivos();
  }, []);

  const handleSucursalChange = (dispositivoId, sucursalId) => {
    setSucursalesSeleccionadas((prev) => ({ ...prev, [dispositivoId]: sucursalId }));
  };

  const handleTipoChange = (dispositivoId, tipo) => {
    setTiposSeleccionados((prev) => ({ ...prev, [dispositivoId]: tipo }));
  };

  const aprobar = async (id) => {
    const sucursal_id = sucursalesSeleccionadas[id];
    if (!sucursal_id) {
      alert('Por favor, selecciona una sucursal para el dispositivo.');
      return;
    }

    try {
      setProcesandoId(id);
      await api.put(`/dispositivos/${id}/aprobar`, {
        sucursal_id,
        tipo: tiposSeleccionados[id] || 'kiosco',
      });
      await cargarDispositivos();
    } catch (error) {
      console.error('Error al aprobar dispositivo:', error);
    } finally {
      setProcesandoId(null);
    }
  };

  const rechazar = async (id) => {
    try {
      setProcesandoId(id);
      await api.put(`/dispositivos/${id}/rechazar`);
      await cargarDispositivos();
    } catch (error) {
      console.error('Error al rechazar dispositivo:', error);
    } finally {
      setProcesandoId(null);
    }
  };

  const iniciarEdicion = (dispositivo) => {
    setEditando(dispositivo.id);
    setFormularioEdicion({
      nombre_dispositivo: dispositivo.nombre_dispositivo || '',
      ubicacion: dispositivo.ubicacion || '',
      sucursal_id: dispositivo.sucursal_id || '',
      tipo: dispositivo.tipo || 'kiosco',
    });
  };

  const actualizarCampo = (campo, valor) => {
    setFormularioEdicion((prev) => ({ ...prev, [campo]: valor }));
  };

  const guardarEdicion = async (id) => {
    if (!formularioEdicion.nombre_dispositivo.trim()) {
      alert('El nombre del dispositivo es requerido.');
      return;
    }

    try {
      setProcesandoId(id);
      await api.put(`/dispositivos/${id}`, formularioEdicion);
      setEditando(null);
      await cargarDispositivos();
    } catch (error) {
      console.error('Error al actualizar dispositivo:', error);
    } finally {
      setProcesandoId(null);
    }
  };

  const eliminar = async (id) => {
    if (!window.confirm('¿Seguro que deseas eliminar este dispositivo? Esta acción no se puede deshacer.')) return;

    try {
      setProcesandoId(id);
      await api.delete(`/dispositivos/${id}`);
      await cargarDispositivos();
    } catch (error) {
      console.error('Error al eliminar dispositivo:', error);
    } finally {
      setProcesandoId(null);
    }
  };

  const getEstadoBadge = (estado) => {
    const badgeMap = {
      pendiente: 'bg-amber-500/10 text-amber-300 border-amber-400/20',
      aprobado: 'bg-emerald-500/10 text-emerald-300 border-emerald-400/20',
      rechazado: 'bg-rose-500/10 text-rose-300 border-rose-400/20',
    };
    return badgeMap[estado] || badgeMap.pendiente;
  };

  const getEstadoTexto = (estado) => {
    const textMap = {
      pendiente: 'Pendiente',
      aprobado: 'Aprobado',
      rechazado: 'Rechazado',
    };
    return textMap[estado] || estado;
  };

  if (cargando) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.14),transparent_32%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.18),transparent_30%),radial-gradient(circle_at_bottom,rgba(15,23,42,0.96),rgba(2,6,23,1))]" />
        <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(rgba(255,255,255,0.9)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.9)_1px,transparent_1px)] bg-size-[36px_36px]" />
        <div className="relative text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-cyan-500"></div>
          <p className="tracking-wide text-slate-400">Cargando dispositivos...</p>
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
                    <Smartphone size={12} />
                    Administración del sistema
                </div>
                <h1 className="mt-3 text-3xl font-medium tracking-tight text-white sm:text-4xl">Dispositivos</h1>
            </div>
        </div>

        {dispositivos.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-white/10 bg-white/3 px-6 py-16 text-center">
            <Smartphone className="mx-auto mb-4 text-slate-600" size={34} />
            <p className="font-medium text-slate-300">No hay dispositivos registrados</p>
            <p className="mt-1 text-sm text-slate-500">Los dispositivos que inicien sesión aparecerán aquí.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/4 shadow-[0_20px_60px_rgba(0,0,0,0.18)] backdrop-blur-xl">
            <div className="overflow-x-auto">
              <table className="w-full min-w-225 border-collapse">
                <thead>
                  <tr className="border-b border-white/10 bg-white/2">
                  <th className="text-left px-5 py-4 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Dispositivo
                  </th>
                  <th className="text-left px-5 py-4 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400 hidden md:table-cell">
                    Sucursal
                  </th>
                  <th className="text-left px-5 py-4 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400 hidden lg:table-cell">
                    Ubicación
                  </th>
                  <th className="text-left px-5 py-4 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Estado
                  </th>
                  <th className="text-left px-5 py-4 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Tipo
                  </th>
                  <th className="text-left px-5 py-4 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Registrado
                  </th>
                  <th className="text-center px-5 py-4 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {dispositivos.map((dispositivo) => {
                  const sucursalAsignada = sucursales.find((s) => s.id === dispositivo.sucursal_id);
                  return (
                    <tr key={dispositivo.id} className="border-b border-white/10 hover:bg-cyan-500/5 transition-colors">
                    <td className="py-4 px-4">
                      <div className="text-white font-medium">{dispositivo.nombre_dispositivo || 'Sin nombre'}</div>
                      <div className="text-gray-500 text-sm mt-1 font-mono">
                        {dispositivo.fingerprint.substring(0, 12)}...
                      </div>
                    </td>
                    <td className="py-4 px-4 text-gray-400 text-sm hidden md:table-cell">
                      {sucursalAsignada?.nombre || <span className="text-gray-500">Sin asignar</span>}
                    </td>
                    <td className="py-4 px-4 text-gray-400 text-sm hidden lg:table-cell">
                      {dispositivo.ubicacion || 'N/A'}
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-sm font-medium border ${
                          getEstadoBadge(dispositivo.estado)
                        }`}
                      >
                        {getEstadoTexto(dispositivo.estado)}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      {dispositivo.estado === 'aprobado' ? (
                        <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium border ${
                          dispositivo.tipo === 'administracion'
                            ? 'bg-cyan-500/10 text-cyan-300 border-cyan-400/20'
                            : 'bg-white/5 text-slate-300 border-white/10'
                        }`}>
                          {dispositivo.tipo === 'administracion' ? 'Admin' : 'Kiosco'}
                        </span>
                      ) : (
                        <span className="text-gray-500 text-sm">—</span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-gray-400 text-sm">
                      {new Date(dispositivo.created_at).toLocaleDateString('es-ES')}
                    </td>
                    <td className="py-4 px-4">
                      {editando === dispositivo.id ? (
                        <div className="flex flex-wrap gap-2 justify-center items-center">
                          <input
                            value={formularioEdicion.nombre_dispositivo}
                            onChange={(e) => actualizarCampo('nombre_dispositivo', e.target.value)}
                            placeholder="Nombre"
                            className="w-40 px-3 py-2 bg-black/20 border border-white/5 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-400 focus:bg-white/10 shadow-inner transition"
                          />
                          <input
                            value={formularioEdicion.ubicacion}
                            onChange={(e) => actualizarCampo('ubicacion', e.target.value)}
                            placeholder="Ubicación"
                            className="w-40 px-3 py-2 bg-black/20 border border-white/5 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-400 focus:bg-white/10 shadow-inner transition"
                          />
                          <select
                            value={formularioEdicion.sucursal_id}
                            onChange={(e) => actualizarCampo('sucursal_id', e.target.value)}
                            className="px-3 py-2 bg-black/20 border border-white/5 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-400 focus:bg-white/10 shadow-inner transition"
                          >
                            <option value="">Sin sucursal</option>
                            {sucursales.filter((s) => s.activo).map((sucursal) => (
                              <option key={sucursal.id} value={sucursal.id}>{sucursal.nombre}</option>
                            ))}
                          </select>
                          <select
                            value={formularioEdicion.tipo}
                            onChange={(e) => actualizarCampo('tipo', e.target.value)}
                            className="px-3 py-2 bg-black/20 border border-white/5 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-400 focus:bg-white/10 shadow-inner transition"
                          >
                            <option value="kiosco">🖥️ Kiosco</option>
                            <option value="administracion">⚙️ Administración</option>
                          </select>
                          <button
                            onClick={() => guardarEdicion(dispositivo.id)}
                            disabled={procesandoId === dispositivo.id}
                            title="Guardar cambios"
                            className="inline-flex items-center gap-1 px-3 py-2 bg-emerald-500/10 text-emerald-300 border border-emerald-400/20 rounded-xl hover:bg-emerald-500/20 disabled:opacity-50 transition text-sm"
                          >
                            <Save size={16} /> Guardar
                          </button>
                          <button
                            onClick={() => setEditando(null)}
                            disabled={procesandoId === dispositivo.id}
                            title="Cancelar edición"
                            className="inline-flex items-center gap-1 px-3 py-2 bg-white/5 border border-white/10 text-gray-300 rounded-xl hover:bg-white/10 disabled:opacity-50 transition text-sm"
                          >
                            <X size={16} /> Cancelar
                          </button>
                        </div>
                      ) : dispositivo.estado === 'pendiente' ? (
                        <div className="flex gap-2 justify-center items-center">
                          <select
                            value={sucursalesSeleccionadas[dispositivo.id] || ''}
                            onChange={(e) => handleSucursalChange(dispositivo.id, e.target.value)}
                            className="px-3 py-2 bg-black/20 border border-white/5 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-400 focus:bg-white/10 shadow-inner transition"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <option value="" disabled>Asignar sucursal</option>
                            {sucursales
                              .filter((s) => s.activo)
                              .map((sucursal) => (
                                <option key={sucursal.id} value={sucursal.id}>
                                  {sucursal.nombre}
                                </option>
                              ))}
                          </select>
                          <select
                            value={tiposSeleccionados[dispositivo.id] || 'kiosco'}
                            onChange={(e) => handleTipoChange(dispositivo.id, e.target.value)}
                            className="px-3 py-2 bg-black/20 border border-white/5 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-400 focus:bg-white/10 shadow-inner transition"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <option value="kiosco">🖥️ Kiosco</option>
                            <option value="administracion">⚙️ Administración</option>
                          </select>
                          <button
                            onClick={() => aprobar(dispositivo.id)}
                            disabled={procesandoId === dispositivo.id}
                            className="inline-flex items-center gap-1 px-3 py-2 bg-emerald-500/10 text-emerald-300 border border-emerald-400/20 rounded-xl hover:bg-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition text-sm"
                          >
                            <Check size={16} />
                            Aprobar
                          </button>
                          <button
                            onClick={() => rechazar(dispositivo.id)}
                            disabled={procesandoId === dispositivo.id}
                            className="inline-flex items-center gap-1 px-3 py-2 bg-rose-500/10 text-rose-300 border border-rose-400/20 rounded-xl hover:bg-rose-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition text-sm"
                          >
                            <X size={16} />
                            Rechazar
                          </button>
                          <button
                            onClick={() => iniciarEdicion(dispositivo)}
                            disabled={procesandoId === dispositivo.id}
                            title="Editar dispositivo"
                            className="inline-flex items-center gap-1 px-3 py-2 bg-cyan-500/10 text-cyan-300 border border-cyan-400/20 rounded-xl hover:bg-cyan-500/20 disabled:opacity-50 transition text-sm"
                          >
                            <Pencil size={16} /> Editar
                          </button>
                          <button
                            onClick={() => eliminar(dispositivo.id)}
                            disabled={procesandoId === dispositivo.id}
                            title="Eliminar dispositivo"
                            className="inline-flex items-center gap-1 px-3 py-2 bg-rose-500/10 text-rose-300 border border-rose-400/20 rounded-xl hover:bg-rose-500/20 disabled:opacity-50 transition text-sm"
                          >
                            <Trash2 size={16} /> Eliminar
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-2 justify-center items-center">
                          <button
                            onClick={() => iniciarEdicion(dispositivo)}
                            disabled={procesandoId === dispositivo.id}
                            title="Editar dispositivo"
                            className="inline-flex items-center gap-1 px-3 py-2 bg-cyan-500/10 text-cyan-300 border border-cyan-400/20 rounded-xl hover:bg-cyan-500/20 disabled:opacity-50 transition text-sm"
                          >
                            <Pencil size={16} /> Editar
                          </button>
                          <button
                            onClick={() => eliminar(dispositivo.id)}
                            disabled={procesandoId === dispositivo.id}
                            title="Eliminar dispositivo"
                            className="inline-flex items-center gap-1 px-3 py-2 bg-rose-500/10 text-rose-300 border border-rose-400/20 rounded-xl hover:bg-rose-500/20 disabled:opacity-50 transition text-sm"
                          >
                            <Trash2 size={16} /> Eliminar
                          </button>
                        </div>
                      )}
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
    </div>
  );
}

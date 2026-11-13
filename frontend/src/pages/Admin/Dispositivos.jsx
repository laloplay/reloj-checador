import { useEffect, useState } from 'react';
import { Check, X, Smartphone, Pencil, Trash2 } from 'lucide-react';
import api from '../../services/api';
import { useAlert } from '../../context/AlertContext';

export function AdminDispositivos() {
  const { mostrarAlerta, confirmar } = useAlert();
  const [dispositivos, setDispositivos] = useState([]);
  const [sucursales, setSucursales] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [procesandoId, setProcesandoId] = useState(null);
  const [sucursalesSeleccionadas, setSucursalesSeleccionadas] = useState({});
  const [tiposSeleccionados, setTiposSeleccionados] = useState({});
  const [dispositivoEditando, setDispositivoEditando] = useState(null);
  const [formularioEdicion, setFormularioEdicion] = useState({
    nombre_dispositivo: '',
    ubicacion: '',
    sucursal_id: '',
    tipo: 'kiosco',
  });
  const [errorEdicion, setErrorEdicion] = useState('');
  const [guardandoEdicion, setGuardandoEdicion] = useState(false);

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
      mostrarAlerta('Por favor, selecciona una sucursal para el dispositivo.', 'warning');
      return;
    }

    try {
      setProcesandoId(id);
      await api.put(`/dispositivos/${id}/aprobar`, {
        sucursal_id,
        tipo: tiposSeleccionados[id] || 'kiosco',
      });
      mostrarAlerta('Dispositivo aprobado correctamente.', 'success');
      await cargarDispositivos();
    } catch (error) {
      console.error('Error al aprobar dispositivo:', error);
      mostrarAlerta('Error al aprobar el dispositivo.', 'error');
    } finally {
      setProcesandoId(null);
    }
  };

  const rechazar = async (id) => {
    try {
      setProcesandoId(id);
      await api.put(`/dispositivos/${id}/rechazar`);
      mostrarAlerta('Dispositivo rechazado.', 'info');
      await cargarDispositivos();
    } catch (error) {
      console.error('Error al rechazar dispositivo:', error);
      mostrarAlerta('Error al rechazar el dispositivo.', 'error');
    } finally {
      setProcesandoId(null);
    }
  };

  const iniciarEdicion = (dispositivo) => {
    setErrorEdicion('');
    setDispositivoEditando(dispositivo);
    setFormularioEdicion({
      nombre_dispositivo: dispositivo.nombre_dispositivo || '',
      ubicacion: dispositivo.ubicacion || '',
      sucursal_id: dispositivo.sucursal_id || '',
      tipo: dispositivo.tipo || 'kiosco',
    });
  };

  const cerrarModalEdicion = () => {
    if (guardandoEdicion) return;
    setDispositivoEditando(null);
    setErrorEdicion('');
  };

  const actualizarCampo = (campo, valor) => {
    setFormularioEdicion((prev) => ({ ...prev, [campo]: valor }));
  };

  const guardarEdicion = async (e) => {
    e.preventDefault();
    if (!dispositivoEditando) return;

    const nombreLimpio = formularioEdicion.nombre_dispositivo.trim();
    if (!nombreLimpio) {
      setErrorEdicion('El nombre del dispositivo es obligatorio.');
      return;
    }

    try {
      setGuardandoEdicion(true);
      setErrorEdicion('');
      await api.put(`/dispositivos/${dispositivoEditando.id}`, {
        ...formularioEdicion,
        nombre_dispositivo: nombreLimpio,
        ubicacion: formularioEdicion.ubicacion.trim(),
        sucursal_id: formularioEdicion.sucursal_id || null,
      });
      setDispositivoEditando(null);
      await cargarDispositivos();
    } catch (error) {
      console.error('Error al actualizar dispositivo:', error);
      setErrorEdicion(
        error.response?.data?.message || 'Error al actualizar el dispositivo.'
      );
    } finally {
      setGuardandoEdicion(false);
    }
  };

  const eliminar = async (id) => {
    const confirmado = await confirmar({
      titulo: 'Eliminar dispositivo',
      mensaje: '¿Seguro que deseas eliminar este dispositivo? Esta acción no se puede deshacer.',
      textoConfirmar: 'Sí, eliminar',
      variante: 'danger',
    });
    if (!confirmado) return;

    try {
      setProcesandoId(id);
      await api.delete(`/dispositivos/${id}`);
      mostrarAlerta('Dispositivo eliminado correctamente.', 'success');
      await cargarDispositivos();
    } catch (error) {
      console.error('Error al eliminar dispositivo:', error);
      mostrarAlerta('Error al eliminar el dispositivo.', 'error');
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
                            className={`inline-block px-3 py-1 rounded-full text-sm font-medium border ${getEstadoBadge(dispositivo.estado)
                              }`}
                          >
                            {getEstadoTexto(dispositivo.estado)}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          {dispositivo.estado === 'aprobado' ? (
                            <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium border ${dispositivo.tipo === 'administracion'
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
                          {dispositivo.estado === 'pendiente' ? (
                            <div className="flex flex-wrap gap-2 justify-center items-center">
                              <select
                                value={sucursalesSeleccionadas[dispositivo.id] || ''}
                                onChange={(e) => handleSucursalChange(dispositivo.id, e.target.value)}
                                className="px-3 py-2 bg-black/20 border border-white/5 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-400 focus:bg-white/10 shadow-inner transition"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <option value="" disabled className="bg-slate-900 text-white">Asignar sucursal</option>
                                {sucursales
                                  .filter((s) => s.activo)
                                  .map((sucursal) => (
                                    <option key={sucursal.id} value={sucursal.id} className="bg-slate-900 text-white">
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
                                <option value="kiosco" className="bg-slate-900 text-white">🖥️ Kiosco</option>
                                <option value="administracion" className="bg-slate-900 text-white">⚙️ Administración</option>
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

        {/* Modal de Edición de Dispositivo */}
        {dispositivoEditando && (
          <div
            onClick={cerrarModalEdicion}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-3 backdrop-blur-md sm:p-4"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="flex max-h-[calc(100dvh-1.5rem)] w-full max-w-md flex-col overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/2 shadow-[0_24px_80px_rgba(0,0,0,0.5)] backdrop-blur-3xl"
            >
              <div className="flex items-center justify-between border-b border-white/10 px-5 pb-4 pt-5 sm:px-7 sm:pb-5 sm:pt-6">
                <div className="min-w-0">
                  <h2 className="m-0 text-lg font-light tracking-wide text-gray-100">
                    Editar dispositivo
                  </h2>
                  <p className="mt-1 truncate font-mono text-xs text-slate-500">
                    ID: {dispositivoEditando.fingerprint?.substring(0, 16)}...
                  </p>
                </div>
                <button
                  type="button"
                  onClick={cerrarModalEdicion}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-gray-400 transition hover:bg-white/10 hover:text-gray-200"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={guardarEdicion} className="flex max-h-[calc(100dvh-10rem)] flex-col">
                <div className="flex flex-col gap-4 overflow-y-auto px-5 py-5 sm:px-7">
                  {errorEdicion && (
                    <div className="rounded-xl border border-rose-400/20 bg-rose-500/10 px-3.5 py-2.5 text-xs text-rose-300">
                      {errorEdicion}
                    </div>
                  )}

                  <div>
                    <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-widest text-gray-500">
                      Nombre del dispositivo
                    </label>
                    <input
                      type="text"
                      value={formularioEdicion.nombre_dispositivo}
                      onChange={(e) => actualizarCampo('nombre_dispositivo', e.target.value)}
                      placeholder="Ej. Kiosco Entrada Principal"
                      required
                      className="w-full rounded-xl border border-white/5 bg-black/20 px-3 py-2.5 text-sm text-white shadow-inner transition focus:border-cyan-400 focus:bg-white/10 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-widest text-gray-500">
                      Ubicación
                    </label>
                    <input
                      type="text"
                      value={formularioEdicion.ubicacion}
                      onChange={(e) => actualizarCampo('ubicacion', e.target.value)}
                      placeholder="Ej. Recepción Planta Baja"
                      className="w-full rounded-xl border border-white/5 bg-black/20 px-3 py-2.5 text-sm text-white shadow-inner transition focus:border-cyan-400 focus:bg-white/10 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-widest text-gray-500">
                      Sucursal
                    </label>
                    <select
                      value={formularioEdicion.sucursal_id}
                      onChange={(e) => actualizarCampo('sucursal_id', e.target.value)}
                      className="w-full rounded-xl border border-white/5 bg-black/20 px-3 py-2.5 text-sm text-white shadow-inner transition focus:border-cyan-400 focus:bg-white/10 focus:outline-none"
                    >
                      <option value="" className="bg-slate-900 text-white">
                        Sin sucursal asignada
                      </option>
                      {sucursales
                        .filter((s) => s.activo)
                        .map((sucursal) => (
                          <option
                            key={sucursal.id}
                            value={sucursal.id}
                            className="bg-slate-900 text-white"
                          >
                            {sucursal.nombre}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-widest text-gray-500">
                      Tipo de acceso
                    </label>
                    <select
                      value={formularioEdicion.tipo}
                      onChange={(e) => actualizarCampo('tipo', e.target.value)}
                      className="w-full rounded-xl border border-white/5 bg-black/20 px-3 py-2.5 text-sm text-white shadow-inner transition focus:border-cyan-400 focus:bg-white/10 focus:outline-none"
                    >
                      <option value="kiosco" className="bg-slate-900 text-white">
                        Kiosco (Reloj Checador)
                      </option>
                      <option value="administracion" className="bg-slate-900 text-white">
                        Administración
                      </option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-3 border-t border-white/10 px-5 pb-5 pt-4 sm:px-7 sm:pb-6">
                  <button
                    type="button"
                    onClick={cerrarModalEdicion}
                    disabled={guardandoEdicion}
                    className="flex-1 rounded-xl border border-white/10 bg-white/5 py-2.5 text-sm font-medium text-gray-300 transition hover:bg-white/10 disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={guardandoEdicion}
                    className="flex-1 rounded-xl bg-cyan-600 py-2.5 text-sm font-medium text-white shadow-lg shadow-cyan-900/20 transition hover:bg-cyan-500 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {guardandoEdicion ? 'Guardando...' : 'Guardar cambios'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

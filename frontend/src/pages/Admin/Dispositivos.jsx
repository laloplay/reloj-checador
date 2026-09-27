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
      pendiente: 'bg-yellow-900/30 text-yellow-400 border-yellow-600/30',
      aprobado: 'bg-green-900/30 text-green-400 border-green-600/30',
      rechazado: 'bg-red-900/30 text-red-400 border-red-600/30',
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
      <div className="flex items-center justify-center min-h-screen bg-neutral-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400 tracking-wide">Cargando dispositivos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-2">
            <Smartphone className="text-blue-400" size={28} />
            <h1 className="text-4xl font-light text-white tracking-wide">Dispositivos</h1>
          </div>
          <p className="text-gray-400 text-sm ml-11">Gestiona los dispositivos registrados</p>
        </div>

        {dispositivos.length === 0 ? (
          <div className="text-center py-12">
            <AlertCircle className="mx-auto text-gray-500 mb-4" size={48} />
            <p className="text-gray-400 tracking-wide">No hay dispositivos registrados</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-blue-900/20">
                  <th className="text-left py-4 px-4 text-gray-300 font-medium text-sm uppercase tracking-widest">
                    Dispositivo
                  </th>
                  <th className="text-left py-4 px-4 text-gray-300 font-medium text-sm uppercase tracking-widest hidden md:table-cell">
                    Sucursal
                  </th>
                  <th className="text-left py-4 px-4 text-gray-300 font-medium text-sm uppercase tracking-widest hidden lg:table-cell">
                    Ubicación
                  </th>
                  <th className="text-left py-4 px-4 text-gray-300 font-medium text-sm uppercase tracking-widest">
                    Estado
                  </th>
                  <th className="text-left py-4 px-4 text-gray-300 font-medium text-sm uppercase tracking-widest">
                    Tipo
                  </th>
                  <th className="text-left py-4 px-4 text-gray-300 font-medium text-sm uppercase tracking-widest">
                    Registrado
                  </th>
                  <th className="text-center py-4 px-4 text-gray-300 font-medium text-sm uppercase tracking-widest">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {dispositivos.map((dispositivo) => {
                  const sucursalAsignada = sucursales.find((s) => s.id === dispositivo.sucursal_id);
                  return (
                    <tr
                    key={dispositivo.id}
                    className="border-b border-blue-900/10 hover:bg-blue-900/5 transition"
                  >
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
                            ? 'bg-blue-900/30 text-blue-400 border-blue-600/30'
                            : 'bg-neutral-800 text-gray-400 border-neutral-600/30'
                        }`}>
                          {dispositivo.tipo === 'administracion' ? '⚙️ Admin' : '🖥️ Kiosco'}
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
                            className="w-40 px-2 py-2 bg-neutral-800 border border-blue-900/40 rounded-lg text-white text-sm focus:outline-none focus:border-blue-600"
                          />
                          <input
                            value={formularioEdicion.ubicacion}
                            onChange={(e) => actualizarCampo('ubicacion', e.target.value)}
                            placeholder="Ubicación"
                            className="w-40 px-2 py-2 bg-neutral-800 border border-blue-900/40 rounded-lg text-white text-sm focus:outline-none focus:border-blue-600"
                          />
                          <select
                            value={formularioEdicion.sucursal_id}
                            onChange={(e) => actualizarCampo('sucursal_id', e.target.value)}
                            className="px-2 py-2 bg-neutral-800 border border-blue-900/40 rounded-lg text-white text-sm focus:outline-none focus:border-blue-600"
                          >
                            <option value="">Sin sucursal</option>
                            {sucursales.filter((s) => s.activo).map((sucursal) => (
                              <option key={sucursal.id} value={sucursal.id}>{sucursal.nombre}</option>
                            ))}
                          </select>
                          <select
                            value={formularioEdicion.tipo}
                            onChange={(e) => actualizarCampo('tipo', e.target.value)}
                            className="px-2 py-2 bg-neutral-800 border border-blue-900/40 rounded-lg text-white text-sm focus:outline-none focus:border-blue-600"
                          >
                            <option value="kiosco">🖥️ Kiosco</option>
                            <option value="administracion">⚙️ Administración</option>
                          </select>
                          <button
                            onClick={() => guardarEdicion(dispositivo.id)}
                            disabled={procesandoId === dispositivo.id}
                            title="Guardar cambios"
                            className="inline-flex items-center gap-1 px-3 py-2 bg-green-900/30 text-green-400 border border-green-600/30 rounded-lg hover:bg-green-900/50 disabled:opacity-50 transition text-sm"
                          >
                            <Save size={16} /> Guardar
                          </button>
                          <button
                            onClick={() => setEditando(null)}
                            disabled={procesandoId === dispositivo.id}
                            title="Cancelar edición"
                            className="inline-flex items-center gap-1 px-3 py-2 bg-neutral-800 text-gray-300 border border-neutral-600/30 rounded-lg hover:bg-neutral-700 disabled:opacity-50 transition text-sm"
                          >
                            <X size={16} /> Cancelar
                          </button>
                        </div>
                      ) : dispositivo.estado === 'pendiente' ? (
                        <div className="flex gap-2 justify-center items-center">
                          <select
                            value={sucursalesSeleccionadas[dispositivo.id] || ''}
                            onChange={(e) => handleSucursalChange(dispositivo.id, e.target.value)}
                            className="px-2 py-2 bg-neutral-800 border border-blue-900/40 rounded-lg text-white text-sm focus:outline-none focus:border-blue-600 transition"
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
                            className="px-2 py-2 bg-neutral-800 border border-blue-900/40 rounded-lg text-white text-sm focus:outline-none focus:border-blue-600 transition"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <option value="kiosco">🖥️ Kiosco</option>
                            <option value="administracion">⚙️ Administración</option>
                          </select>
                          <button
                            onClick={() => aprobar(dispositivo.id)}
                            disabled={procesandoId === dispositivo.id}
                            className="inline-flex items-center gap-1 px-3 py-2 bg-green-900/30 text-green-400 border border-green-600/30 rounded-lg hover:bg-green-900/50 disabled:opacity-50 disabled:cursor-not-allowed transition text-sm"
                          >
                            <Check size={16} />
                            Aprobar
                          </button>
                          <button
                            onClick={() => rechazar(dispositivo.id)}
                            disabled={procesandoId === dispositivo.id}
                            className="inline-flex items-center gap-1 px-3 py-2 bg-red-900/30 text-red-400 border border-red-600/30 rounded-lg hover:bg-red-900/50 disabled:opacity-50 disabled:cursor-not-allowed transition text-sm"
                          >
                            <X size={16} />
                            Rechazar
                          </button>
                          <button
                            onClick={() => iniciarEdicion(dispositivo)}
                            disabled={procesandoId === dispositivo.id}
                            title="Editar dispositivo"
                            className="inline-flex items-center gap-1 px-3 py-2 bg-blue-900/30 text-blue-400 border border-blue-600/30 rounded-lg hover:bg-blue-900/50 disabled:opacity-50 transition text-sm"
                          >
                            <Pencil size={16} /> Editar
                          </button>
                          <button
                            onClick={() => eliminar(dispositivo.id)}
                            disabled={procesandoId === dispositivo.id}
                            title="Eliminar dispositivo"
                            className="inline-flex items-center gap-1 px-3 py-2 bg-red-900/30 text-red-400 border border-red-600/30 rounded-lg hover:bg-red-900/50 disabled:opacity-50 transition text-sm"
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
                            className="inline-flex items-center gap-1 px-3 py-2 bg-blue-900/30 text-blue-400 border border-blue-600/30 rounded-lg hover:bg-blue-900/50 disabled:opacity-50 transition text-sm"
                          >
                            <Pencil size={16} /> Editar
                          </button>
                          <button
                            onClick={() => eliminar(dispositivo.id)}
                            disabled={procesandoId === dispositivo.id}
                            title="Eliminar dispositivo"
                            className="inline-flex items-center gap-1 px-3 py-2 bg-red-900/30 text-red-400 border border-red-600/30 rounded-lg hover:bg-red-900/50 disabled:opacity-50 transition text-sm"
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
        )}
      </div>
    </div>
  );
}

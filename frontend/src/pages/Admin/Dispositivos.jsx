import { useEffect, useState } from 'react';
import { Check, X, Smartphone, AlertCircle } from 'lucide-react';
import api from '../../services/api';

export function AdminDispositivos() {
  const [dispositivos, setDispositivos] = useState([]);
  const [sucursales, setSucursales] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [procesandoId, setProcesandoId] = useState(null);
  const [sucursalesSeleccionadas, setSucursalesSeleccionadas] = useState({});

  useEffect(() => {
    cargarDispositivos();
  }, []);

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

  const handleSucursalChange = (dispositivoId, sucursalId) => {
    setSucursalesSeleccionadas((prev) => ({ ...prev, [dispositivoId]: sucursalId }));
  };

  const aprobar = async (id) => {
    const sucursal_id = sucursalesSeleccionadas[id];
    if (!sucursal_id) {
      alert('Por favor, selecciona una sucursal para el dispositivo.');
      return;
    }

    try {
      setProcesandoId(id);
      await api.put(`/dispositivos/${id}/aprobar`, { sucursal_id });
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
                    <td className="py-4 px-4 text-gray-400 text-sm">
                      {new Date(dispositivo.created_at).toLocaleDateString('es-ES')}
                    </td>
                    <td className="py-4 px-4">
                      {dispositivo.estado === 'pendiente' ? (
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
                        </div>
                      ) : (
                        <span className="text-gray-500 text-sm">—</span>
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

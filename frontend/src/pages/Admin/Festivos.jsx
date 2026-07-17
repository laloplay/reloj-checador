import { useEffect, useState } from 'react';
import { Plus, Edit, X, CalendarDays, ToggleLeft, ToggleRight } from 'lucide-react';
import api from '../../services/api';

const fechaActual = new Date().toISOString().split('T')[0];

export function AdminFestivos() {
  const [festivos, setFestivos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [festivoEditando, setFestivoEditando] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    fecha: fechaActual,
    aplica_todos_los_años: true,
    activo: true,
  });
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    cargarFestivos();
  }, []);

  const cargarFestivos = async () => {
    try {
      setCargando(true);
      const res = await api.get('/festivos');
      setFestivos(res.data);
    } catch (error) {
      console.error('Error al cargar días festivos:', error);
    } finally {
      setCargando(false);
    }
  };

  const abrirModalCrear = () => {
    setFestivoEditando(null);
    setFormData({
      nombre: '',
      fecha: fechaActual,
      aplica_todos_los_años: true,
      activo: true,
    });
    setModalAbierto(true);
  };

  const abrirModalEditar = (festivo) => {
    setFestivoEditando(festivo);
    setFormData({
      nombre: festivo.nombre || '',
      fecha: festivo.fecha ? festivo.fecha.split('T')[0] : fechaActual,
      aplica_todos_los_años: festivo.aplica_todos_los_años !== false,
      activo: festivo.activo !== false,
    });
    setModalAbierto(true);
  };

  const guardarFestivo = async (e) => {
    e.preventDefault();

    if (!formData.nombre || !formData.fecha) {
      alert('Completa el nombre y la fecha del día festivo.');
      return;
    }

    try {
      setGuardando(true);

      if (festivoEditando) {
        await api.put(`/festivos/${festivoEditando.id}`, formData);
      } else {
        await api.post('/festivos', formData);
      }

      await cargarFestivos();
      setModalAbierto(false);
    } catch (error) {
      console.error('Error al guardar festivo:', error);
      alert('Error al guardar el día festivo');
    } finally {
      setGuardando(false);
    }
  };

  const desactivarFestivo = async (id) => {
    if (!window.confirm('¿Estás seguro de que quieres desactivar este día festivo?')) return;

    try {
      await api.delete(`/festivos/${id}`);
      await cargarFestivos();
    } catch (error) {
      console.error('Error al desactivar festivo:', error);
      alert('Error al desactivar el día festivo');
    }
  };

  const toggleActivo = async (festivo) => {
    try {
      await api.put(`/festivos/${festivo.id}`, {
        nombre: festivo.nombre,
        fecha: festivo.fecha ? festivo.fecha.split('T')[0] : fechaActual,
        aplica_todos_los_años: festivo.aplica_todos_los_años,
        activo: !festivo.activo,
      });
      await cargarFestivos();
    } catch (error) {
      console.error('Error al cambiar estado del festivo:', error);
      alert('Error al cambiar el estado del día festivo');
    }
  };

  if (cargando) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-neutral-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400 tracking-wide">Cargando días festivos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-12">
          <div>
            <h1 className="text-4xl font-light text-white tracking-wide">Días Festivos</h1>
            <p className="text-gray-400 text-sm mt-2">Administra los días festivos de México y fechas personalizadas</p>
          </div>
          <button
            onClick={abrirModalCrear}
            className="inline-flex items-center gap-2 px-4 py-3 bg-linear-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-blue-800 transition"
          >
            <Plus size={20} />
            Nuevo festivo
          </button>
        </div>

        {festivos.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 tracking-wide">No hay días festivos registrados</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-blue-900/20">
                  <th className="text-left py-4 px-4 text-gray-300 font-medium text-sm uppercase tracking-widest">Nombre</th>
                  <th className="text-left py-4 px-4 text-gray-300 font-medium text-sm uppercase tracking-widest">Fecha</th>
                  <th className="text-left py-4 px-4 text-gray-300 font-medium text-sm uppercase tracking-widest">Aplica todos los años</th>
                  <th className="text-left py-4 px-4 text-gray-300 font-medium text-sm uppercase tracking-widest">Estado</th>
                  <th className="text-center py-4 px-4 text-gray-300 font-medium text-sm uppercase tracking-widest">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {festivos.map((festivo) => (
                  <tr key={festivo.id} className="border-b border-blue-900/10 hover:bg-blue-900/5 transition">
                    <td className="py-4 px-4 text-white font-medium">{festivo.nombre}</td>
                    <td className="py-4 px-4 text-gray-400 text-sm whitespace-nowrap">
                      {new Date(festivo.fecha).toLocaleDateString('es-MX', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-4 px-4 text-gray-400 text-sm">
                      {festivo.aplica_todos_los_años ? 'Sí' : 'No'}
                    </td>
                    <td className="py-4 px-4">
                      <button
                        onClick={() => toggleActivo(festivo)}
                        className="inline-flex items-center gap-2 text-sm font-medium transition"
                      >
                        {festivo.activo ? (
                          <>
                            <ToggleRight className="text-green-400" size={22} />
                            <span className="text-green-400">Activo</span>
                          </>
                        ) : (
                          <>
                            <ToggleLeft className="text-gray-500" size={22} />
                            <span className="text-gray-500">Inactivo</span>
                          </>
                        )}
                      </button>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex gap-2 justify-center">
                        <button
                          onClick={() => abrirModalEditar(festivo)}
                          className="inline-flex items-center gap-1 px-3 py-2 bg-blue-900/30 text-blue-400 border border-blue-600/30 rounded-lg hover:bg-blue-900/50 transition text-sm"
                        >
                          <Edit size={16} />
                        </button>
                        {festivo.activo && (
                          <button
                            onClick={() => desactivarFestivo(festivo.id)}
                            className="inline-flex items-center gap-1 px-3 py-2 bg-red-900/30 text-red-400 border border-red-600/30 rounded-lg hover:bg-red-900/50 transition text-sm"
                          >
                            <CalendarDays size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
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
                {festivoEditando ? 'Editar día festivo' : 'Nuevo día festivo'}
              </h2>
              <button
                onClick={() => setModalAbierto(false)}
                className="text-gray-400 hover:text-gray-300"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={guardarFestivo} className="space-y-4">
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">Nombre</label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="w-full px-4 py-2 bg-neutral-800 border border-blue-900/40 rounded-lg text-white focus:outline-none focus:border-blue-600 transition"
                />
              </div>

              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">Fecha</label>
                <input
                  type="date"
                  value={formData.fecha}
                  onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                  className="w-full px-4 py-2 bg-neutral-800 border border-blue-900/40 rounded-lg text-white focus:outline-none focus:border-blue-600 transition"
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  id="aplica_todos_los_años"
                  type="checkbox"
                  checked={formData.aplica_todos_los_años}
                  onChange={(e) => setFormData({ ...formData, aplica_todos_los_años: e.target.checked })}
                  className="h-4 w-4 rounded border-blue-900/40 bg-neutral-800 text-blue-600 focus:ring-blue-600"
                />
                <label htmlFor="aplica_todos_los_años" className="text-gray-300 text-sm font-medium">
                  Aplica todos los años
                </label>
              </div>

              {festivoEditando && (
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">Estado</label>
                  <select
                    value={formData.activo}
                    onChange={(e) => setFormData({ ...formData, activo: e.target.value === 'true' })}
                    className="w-full px-4 py-2 bg-neutral-800 border border-blue-900/40 rounded-lg text-white focus:outline-none focus:border-blue-600 transition"
                  >
                    <option value="true">Activo</option>
                    <option value="false">Inactivo</option>
                  </select>
                </div>
              )}

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
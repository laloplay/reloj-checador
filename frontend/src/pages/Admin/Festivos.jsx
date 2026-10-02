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
      <div className="relative min-h-screen overflow-hidden bg-slate-950 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400 tracking-wide">Cargando días festivos...</p>
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
                    <CalendarDays size={12} />
                    Gestión de personal
                </div>
                <h1 className="mt-3 text-3xl font-medium tracking-tight text-white sm:text-4xl">Días Festivos</h1>
            </div>
            <button
                onClick={abrirModalCrear}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-600 px-4 py-3 text-sm font-medium text-white shadow-lg shadow-cyan-950/30 transition hover:bg-cyan-500 active:scale-[0.99] sm:w-auto"
            >
                <Plus size={18} />
                Nuevo festivo
            </button>
        </div>

        {festivos.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-white/10 bg-white/3 px-6 py-16 text-center">
            <CalendarDays className="mx-auto mb-4 text-slate-600" size={34} />
            <p className="font-medium text-slate-300">No hay días festivos registrados</p>
            <p className="mt-1 text-sm text-slate-500">Agrega un día festivo para comenzar a gestionarlos.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/4 shadow-[0_20px_60px_rgba(0,0,0,0.18)] backdrop-blur-xl">
            <div className="overflow-x-auto">
              <table className="w-full min-w-225 border-collapse">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-4 px-4 text-gray-300 font-medium text-sm uppercase tracking-widest">Nombre</th>
                  <th className="text-left py-4 px-4 text-gray-300 font-medium text-sm uppercase tracking-widest">Fecha</th>
                  <th className="text-left py-4 px-4 text-gray-300 font-medium text-sm uppercase tracking-widest">Aplica todos los años</th>
                  <th className="text-left py-4 px-4 text-gray-300 font-medium text-sm uppercase tracking-widest">Estado</th>
                  <th className="text-center py-4 px-4 text-gray-300 font-medium text-sm uppercase tracking-widest">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {festivos.map((festivo) => (
                  <tr key={festivo.id} className="border-b border-white/10 hover:bg-cyan-500/5 transition">
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
                          className="inline-flex items-center gap-1 px-3 py-2 bg-cyan-500/10 text-cyan-300 border border-cyan-400/20 rounded-xl hover:bg-cyan-500/20 transition text-sm"
                        >
                          <Edit size={16} />
                        </button>
                        {festivo.activo && (
                          <button
                            onClick={() => desactivarFestivo(festivo.id)}
                            className="inline-flex items-center gap-1 px-3 py-2 bg-red-900/30 text-red-400 border border-red-600/30 rounded-xl hover:bg-red-900/50 transition text-sm"
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
                      {festivoEditando ? 'Editar día festivo' : 'Nuevo día festivo'}
                  </h2>
              </div>
              <button
                  onClick={() => setModalAbierto(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-gray-200 hover:bg-white/10 transition"
              >
                  <X size={16} />
              </button>
            </div>

            <form onSubmit={guardarFestivo} className="flex flex-col max-h-[calc(100dvh-10rem)]">
              <div className="flex flex-col gap-4 px-5 py-5 sm:px-7 overflow-y-auto">
                <div>
                  <label className="block text-[11px] uppercase tracking-widest text-gray-500 font-medium mb-1.5">Nombre</label>
                  <input
                    type="text"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    className="w-full px-3 py-2.5 bg-black/20 border border-white/5 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-400 focus:bg-white/10 shadow-inner transition"
                  />
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-widest text-gray-500 font-medium mb-1.5">Fecha</label>
                  <input
                    type="date"
                    value={formData.fecha}
                    onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                    className="w-full px-3 py-2.5 bg-black/20 border border-white/5 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-400 focus:bg-white/10 shadow-inner transition"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <input
                    id="aplica_todos_los_años"
                    type="checkbox"
                    checked={formData.aplica_todos_los_años}
                    onChange={(e) => setFormData({ ...formData, aplica_todos_los_años: e.target.checked })}
                    className="h-4 w-4 rounded accent-cyan-500"
                  />
                  <label htmlFor="aplica_todos_los_años" className="text-gray-300 text-sm font-medium">
                    Aplica todos los años
                  </label>
                </div>

                {festivoEditando && (
                  <div>
                    <label className="block text-[11px] uppercase tracking-widest text-gray-500 font-medium mb-1.5">Estado</label>
                    <select
                      value={formData.activo}
                      onChange={(e) => setFormData({ ...formData, activo: e.target.value === 'true' })}
                      className="w-full px-3 py-2.5 bg-black/20 border border-white/5 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-400 focus:bg-white/10 shadow-inner transition"
                    >
                      <option value="true">Activo</option>
                      <option value="false">Inactivo</option>
                    </select>
                  </div>
                )}
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
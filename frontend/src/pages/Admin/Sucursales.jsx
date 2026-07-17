import { useEffect, useState } from 'react';
import { Plus, Edit, X, PowerOff } from 'lucide-react';
import api from '../../services/api';

export function AdminSucursales() {
    const [sucursales, setSucursales] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [modalAbierto, setModalAbierto] = useState(false);
    const [sucursalEditando, setSucursalEditando] = useState(null);
    const [formData, setFormData] = useState({
        nombre: '',
        direccion: '',
        activo: true,
    });
    const [guardando, setGuardando] = useState(false);

    useEffect(() => {
        cargarSucursales();
    }, []);

    const cargarSucursales = async () => {
        try {
            setCargando(true);
            const res = await api.get('/sucursales');
            setSucursales(res.data);
        } catch (error) {
            console.error('Error al cargar sucursales:', error);
        } finally {
            setCargando(false);
        }
    };

    const abrirModalCrear = () => {
        setSucursalEditando(null);
        setFormData({ nombre: '', direccion: '', activo: true });
        setModalAbierto(true);
    };

    const abrirModalEditar = (sucursal) => {
        setSucursalEditando(sucursal);
        setFormData({
            nombre: sucursal.nombre,
            direccion: sucursal.direccion || '',
            activo: sucursal.activo,
        });
        setModalAbierto(true);
    };

    const guardarSucursal = async (e) => {
        e.preventDefault();

        if (!formData.nombre) {
            alert('Por favor, introduce el nombre de la sucursal.');
            return;
        }

        try {
            setGuardando(true);

            if (sucursalEditando) {
                await api.put(`/sucursales/${sucursalEditando.id}`, formData);
            } else {
                await api.post('/sucursales', { nombre: formData.nombre, direccion: formData.direccion });
            }

            await cargarSucursales();
            setModalAbierto(false);
        } catch (error) {
            console.error('Error al guardar sucursal:', error);
            alert('Error al guardar la sucursal');
        } finally {
            setGuardando(false);
        }
    };

    const desactivarSucursal = async (id) => {
        if (!window.confirm('¿Estás seguro de que quieres desactivar esta sucursal?')) return;

        try {
            await api.delete(`/sucursales/${id}`);
            await cargarSucursales();
        } catch (error) {
            console.error('Error al desactivar sucursal:', error);
            alert('Error al desactivar la sucursal');
        }
    };

    if (cargando) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-neutral-950">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p className="text-gray-400 tracking-wide">Cargando sucursales...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-neutral-950 p-8">
            <div className="max-w-6xl mx-auto">
                <div className="flex items-center justify-between mb-12">
                    <div>
                        <h1 className="text-4xl font-light text-white tracking-wide">Sucursales</h1>
                        <p className="text-gray-400 text-sm mt-2">Gestiona las sucursales de la empresa</p>
                    </div>
                    <button
                        onClick={abrirModalCrear}
                        className="inline-flex items-center gap-2 px-4 py-3 bg-linear-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-blue-800 transition"
                    >
                        <Plus size={20} />
                        Nueva sucursal
                    </button>
                </div>

                {sucursales.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-gray-400 tracking-wide">No hay sucursales registradas</p>
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
                                        Dirección
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
                                {sucursales.map((sucursal) => (
                                    <tr
                                        key={sucursal.id}
                                        className="border-b border-blue-900/10 hover:bg-blue-900/5 transition"
                                    >
                                        <td className="py-4 px-4 text-white font-medium">
                                            {sucursal.nombre}
                                        </td>
                                        <td className="py-4 px-4 text-gray-400 text-sm">
                                            {sucursal.direccion || 'N/A'}
                                        </td>
                                        <td className="py-4 px-4">
                                            <span
                                                className={`inline-block px-3 py-1 rounded-full text-sm font-medium border ${
                                                    sucursal.activo
                                                        ? 'bg-green-900/30 text-green-400 border-green-600/30'
                                                        : 'bg-red-900/30 text-red-400 border-red-600/30'
                                                }`}
                                            >
                                                {sucursal.activo ? 'Activa' : 'Inactiva'}
                                            </span>
                                        </td>
                                        <td className="py-4 px-4">
                                            <div className="flex gap-2 justify-center">
                                                <button
                                                    onClick={() => abrirModalEditar(sucursal)}
                                                    className="inline-flex items-center gap-1 px-3 py-2 bg-blue-900/30 text-blue-400 border border-blue-600/30 rounded-lg hover:bg-blue-900/50 transition text-sm"
                                                >
                                                    <Edit size={16} />
                                                </button>
                                                {sucursal.activo && (
                                                    <button
                                                        onClick={() => desactivarSucursal(sucursal.id)}
                                                        className="inline-flex items-center gap-1 px-3 py-2 bg-red-900/30 text-red-400 border border-red-600/30 rounded-lg hover:bg-red-900/50 transition text-sm"
                                                    >
                                                        <PowerOff size={16} />
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
                                {sucursalEditando ? 'Editar sucursal' : 'Nueva sucursal'}
                            </h2>
                            <button
                                onClick={() => setModalAbierto(false)}
                                className="text-gray-400 hover:text-gray-300"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={guardarSucursal} className="space-y-4">
                            <div>
                                <label className="block text-gray-300 text-sm font-medium mb-2">Nombre</label>
                                <input
                                    type="text"
                                    value={formData.nombre}
                                    onChange={(e) =>
                                        setFormData({ ...formData, nombre: e.target.value })
                                    }
                                    className="w-full px-4 py-2 bg-neutral-800 border border-blue-900/40 rounded-lg text-white focus:outline-none focus:border-blue-600 transition"
                                />
                            </div>

                            <div>
                                <label className="block text-gray-300 text-sm font-medium mb-2">
                                    Dirección
                                </label>
                                <textarea
                                    value={formData.direccion}
                                    onChange={(e) =>
                                        setFormData({ ...formData, direccion: e.target.value })
                                    }
                                    rows="3"
                                    className="w-full px-4 py-2 bg-neutral-800 border border-blue-900/40 rounded-lg text-white focus:outline-none focus:border-blue-600 transition"
                                />
                            </div>

                            {sucursalEditando && (
                                <div>
                                    <label className="block text-gray-300 text-sm font-medium mb-2">Estado</label>
                                    <select
                                        value={formData.activo}
                                        onChange={(e) => setFormData({ ...formData, activo: e.target.value === 'true' })}
                                        className="w-full px-4 py-2 bg-neutral-800 border border-blue-900/40 rounded-lg text-white focus:outline-none focus:border-blue-600 transition"
                                    >
                                        <option value="true">Activa</option>
                                        <option value="false">Inactiva</option>
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
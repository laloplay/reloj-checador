import { useEffect, useState } from 'react';
import { Plus, Edit, X, Power, PowerOff } from 'lucide-react';
import api from '../../services/api';

export function AdminPuestos() {
    const [puestos, setPuestos] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [modalAbierto, setModalAbierto] = useState(false);
    const [puestoEditando, setPuestoEditando] = useState(null);
    const [mostrarInactivos, setMostrarInactivos] = useState(false);
    const [formData, setFormData] = useState({
        nombre: '',
        descripcion: '',
        salario_base: '',
        activo: true,
    });
    const [guardando, setGuardando] = useState(false);

    useEffect(() => {
        cargarPuestos();
    }, []);

    const cargarPuestos = async () => {
        try {
            setCargando(true);
            const res = await api.get('/puestos');
            setPuestos(res.data);
        } catch (error) {
            console.error('Error al cargar puestos:', error);
        } finally {
            setCargando(false);
        }
    };

    const abrirModalCrear = () => {
        setPuestoEditando(null);
        setFormData({ nombre: '', descripcion: '', salario_base: '', activo: true });
        setModalAbierto(true);
    };

    const abrirModalEditar = (puesto) => {
        setPuestoEditando(puesto);
        setFormData({
            nombre: puesto.nombre,
            descripcion: puesto.descripcion || '',
            salario_base: puesto.salario_base,
            activo: puesto.activo,
        });
        setModalAbierto(true);
    };

    const guardarPuesto = async (e) => {
        e.preventDefault();

        if (!formData.nombre || formData.salario_base === '') {
            alert('Por favor, introduce el nombre y el salario base.');
            return;
        }

        try {
            setGuardando(true);

            if (puestoEditando) {
                await api.put(`/puestos/${puestoEditando.id}`, formData);
            } else {
                await api.post('/puestos', formData);
            }

            await cargarPuestos();
            setModalAbierto(false);
        } catch (error) {
            console.error('Error al guardar puesto:', error);
            alert('Error al guardar el puesto');
        } finally {
            setGuardando(false);
        }
    };

    const desactivarPuesto = async (id) => {
        if (!window.confirm('¿Estás seguro de que quieres desactivar este puesto?')) return;

        try {
            await api.delete(`/puestos/${id}`);
            await cargarPuestos();
        } catch (error) {
            console.error('Error al desactivar puesto:', error);
            alert('Error al desactivar el puesto');
        }
    };

    const reactivarPuesto = async (id) => {
        try {
            const puesto = puestos.find(p => p.id === id);
            await api.put(`/puestos/${id}`, { ...puesto, activo: true });
            await cargarPuestos();
        } catch (error) {
            console.error('Error al reactivar puesto:', error);
        }
    };

    const puestosFiltrados = mostrarInactivos ? puestos : puestos.filter(p => p.activo);

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value);
    };

    if (cargando) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-neutral-950">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p className="text-gray-400 tracking-wide">Cargando puestos...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-neutral-950 p-8">
            <div className="max-w-6xl mx-auto">
                <div className="flex items-center justify-between mb-12">
                    <div>
                        <h1 className="text-4xl font-light text-white tracking-wide">Puestos</h1>
                        <p className="text-gray-400 text-sm mt-2">Gestiona los puestos de la empresa</p>
                    </div>
                    <button
                        onClick={abrirModalCrear}
                        className="inline-flex items-center gap-2 px-4 py-3 bg-linear-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-blue-800 transition"
                    >
                        <Plus size={20} />
                        Nuevo puesto
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
                        Mostrar puestos inactivos
                    </label>
                </div>

                {puestosFiltrados.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-gray-400 tracking-wide">No hay puestos registrados</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="border-b border-blue-900/20">
                                    <th className="text-left py-4 px-4 text-gray-300 font-medium text-sm uppercase tracking-widest">Nombre</th>
                                    <th className="text-left py-4 px-4 text-gray-300 font-medium text-sm uppercase tracking-widest">Descripción</th>
                                    <th className="text-left py-4 px-4 text-gray-300 font-medium text-sm uppercase tracking-widest">Salario Base</th>
                                    <th className="text-left py-4 px-4 text-gray-300 font-medium text-sm uppercase tracking-widest">Estado</th>
                                    <th className="text-center py-4 px-4 text-gray-300 font-medium text-sm uppercase tracking-widest">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {puestosFiltrados.map((puesto) => (
                                    <tr key={puesto.id} className="border-b border-blue-900/10 hover:bg-blue-900/5 transition">
                                        <td className="py-4 px-4 text-white font-medium">{puesto.nombre}</td>
                                        <td className="py-4 px-4 text-gray-400 text-sm">{puesto.descripcion || 'N/A'}</td>
                                        <td className="py-4 px-4 text-gray-400 text-sm">{formatCurrency(puesto.salario_base)}</td>
                                        <td className="py-4 px-4">
                                            <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium border ${puesto.activo ? 'bg-green-900/30 text-green-400 border-green-600/30' : 'bg-red-900/30 text-red-400 border-red-600/30'}`}>
                                                {puesto.activo ? 'Activo' : 'Inactivo'}
                                            </span>
                                        </td>
                                        <td className="py-4 px-4">
                                            <div className="flex gap-2 justify-center">
                                                <button onClick={() => abrirModalEditar(puesto)} className="inline-flex items-center gap-1 px-3 py-2 bg-blue-900/30 text-blue-400 border border-blue-600/30 rounded-lg hover:bg-blue-900/50 transition text-sm">
                                                    <Edit size={16} />
                                                </button>
                                                {puesto.activo ? (
                                                    <button onClick={() => desactivarPuesto(puesto.id)} className="inline-flex items-center gap-1 px-3 py-2 bg-red-900/30 text-red-400 border border-red-600/30 rounded-lg hover:bg-red-900/50 transition text-sm">
                                                        <PowerOff size={16} />
                                                    </button>
                                                ) : (
                                                    <button onClick={() => reactivarPuesto(puesto.id)} className="inline-flex items-center gap-1 px-3 py-2 bg-green-900/30 text-green-400 border border-green-600/30 rounded-lg hover:bg-green-900/50 transition text-sm">
                                                        <Power size={16} />
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
                            <h2 className="text-2xl font-light text-white tracking-wide">{puestoEditando ? 'Editar puesto' : 'Nuevo puesto'}</h2>
                            <button onClick={() => setModalAbierto(false)} className="text-gray-400 hover:text-gray-300">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={guardarPuesto} className="space-y-4">
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
                                <label className="block text-gray-300 text-sm font-medium mb-2">Descripción</label>
                                <textarea
                                    value={formData.descripcion}
                                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                                    rows="3"
                                    className="w-full px-4 py-2 bg-neutral-800 border border-blue-900/40 rounded-lg text-white focus:outline-none focus:border-blue-600 transition"
                                />
                            </div>

                            <div>
                                <label className="block text-gray-300 text-sm font-medium mb-2">Salario Base (MXN)</label>
                                <div className="relative">
                                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">$</span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={formData.salario_base}
                                        onChange={(e) => setFormData({ ...formData, salario_base: e.target.value })}
                                        className="w-full pl-7 pr-4 py-2 bg-neutral-800 border border-blue-900/40 rounded-lg text-white focus:outline-none focus:border-blue-600 transition"
                                    />
                                </div>
                            </div>

                            {puestoEditando && (
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
                                <button type="button" onClick={() => setModalAbierto(false)} className="flex-1 py-2 bg-neutral-800 text-gray-300 border border-neutral-700 rounded-lg hover:bg-neutral-700 transition">
                                    Cancelar
                                </button>
                                <button type="submit" disabled={guardando} className="flex-1 py-2 bg-linear-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition">
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
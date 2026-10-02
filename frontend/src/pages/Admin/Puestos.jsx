import { useEffect, useState } from 'react';
import { Plus, Edit, X, Power, PowerOff, Briefcase } from 'lucide-react';
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
        <div className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.14),transparent_32%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.18),transparent_30%),radial-gradient(circle_at_bottom,rgba(15,23,42,0.96),rgba(2,6,23,1))]" />
            <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(rgba(255,255,255,0.9)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.9)_1px,transparent_1px)] bg-size-[36px_36px]" />
            <div className="relative mx-auto flex max-w-7xl flex-col gap-6 px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
                <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.28em] text-cyan-100">
                            <Briefcase size={12} />
                            Gestión de personal
                        </div>
                        <h1 className="mt-3 text-3xl font-medium tracking-tight text-white sm:text-4xl">Puestos</h1>
                    </div>
                    <button
                        onClick={abrirModalCrear}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-600 px-4 py-3 text-sm font-medium text-white shadow-lg shadow-cyan-950/30 transition hover:bg-cyan-500 active:scale-[0.99] sm:w-auto"
                    >
                        <Plus size={18} />
                        Nuevo puesto
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
                        Mostrar puestos inactivos
                    </label>
                </div>

                {puestosFiltrados.length === 0 ? (
                    <div className="rounded-3xl border border-dashed border-white/10 bg-white/3 px-6 py-16 text-center">
                        <Briefcase className="mx-auto mb-4 text-slate-600" size={34} />
                        <p className="font-medium text-slate-300">No hay puestos registrados</p>
                        <p className="mt-1 text-sm text-slate-500">Agrega el primero para comenzar a estructurar tu equipo.</p>
                    </div>
                ) : (
                <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/4 shadow-[0_20px_60px_rgba(0,0,0,0.18)] backdrop-blur-xl">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-225 border-collapse">
                            <thead>
                                <tr className="border-b border-white/10 bg-white/2">
                                    <th className="px-5 py-4 text-left text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                                        Nombre
                                    </th>
                                    <th className="px-5 py-4 text-left text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                                        Descripción
                                    </th>
                                    <th className="px-5 py-4 text-left text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                                        Salario Base
                                    </th>
                                    <th className="px-5 py-4 text-left text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                                        Estado
                                    </th>
                                    <th className="px-5 py-4 text-center text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                                        Acciones
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {puestosFiltrados.map((puesto) => (
                                    <tr key={puesto.id} className="border-b border-white/10 hover:bg-cyan-500/5 transition">
                                        <td className="px-4 py-4 text-sm text-slate-400">
                                            {puesto.nombre}
                                        </td>
                                        <td className="px-4 py-4 text-sm text-slate-400">
                                            {puesto.descripcion || 'N/A'}
                                        </td>
                                        <td className="px-4 py-4 text-sm text-slate-400">
                                            {formatCurrency(puesto.salario_base)}
                                        </td>
                                        <td className="px-4 py-4 text-sm text-slate-400">
                                            <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium border ${puesto.activo ? 'bg-green-900/30 text-green-400 border-green-600/30' : 'bg-red-900/30 text-red-400 border-red-600/30'}`}>
                                                {puesto.activo ? 'Activo' : 'Inactivo'}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="flex gap-2 justify-center">
                                                <button onClick={() => abrirModalEditar(puesto)} className="inline-flex items-center gap-1 px-3 py-2 bg-cyan-500/10 text-cyan-300 border border-cyan-400/20 rounded-xl hover:bg-cyan-500/20 transition text-sm">
                                                    <Edit size={16} />
                                                </button>
                                                {puesto.activo ? (
                                                    <button onClick={() => desactivarPuesto(puesto.id)} className="inline-flex items-center gap-1 px-3 py-2 bg-red-900/30 text-red-400 border border-red-600/30 rounded-xl hover:bg-red-900/50 transition text-sm">
                                                        <PowerOff size={16} />
                                                    </button>
                                                ) : (
                                                    <button onClick={() => reactivarPuesto(puesto.id)} className="inline-flex items-center gap-1 px-3 py-2 bg-green-900/30 text-green-400 border border-green-600/30 rounded-xl hover:bg-green-900/50 transition text-sm">
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
                </div>
                )}
            </div>

            {modalAbierto && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-3 backdrop-blur-md sm:p-4">
                    <div className="max-h-[calc(100dvh-1.5rem)] w-full max-w-md overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/[0.02] shadow-[0_24px_80px_rgba(0,0,0,0.5)] backdrop-blur-3xl flex flex-col">
                        <div className="flex items-center justify-between border-b border-white/10 px-5 pb-4 pt-5 sm:px-7 sm:pb-5 sm:pt-6">
                            <div>
                                <p className="text-[11px] uppercase tracking-widest text-gray-500 font-medium mb-0.5">Gestión de personal</p>
                                <h2 className="text-lg font-light text-gray-100 tracking-wide m-0">{puestoEditando ? 'Editar puesto' : 'Nuevo puesto'}</h2>
                            </div>
                            <button
                                onClick={() => setModalAbierto(false)}
                                className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-gray-200 hover:bg-white/10 transition"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <form onSubmit={guardarPuesto} className="flex flex-col max-h-[calc(100dvh-10rem)]">
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
                                <label className="block text-[11px] uppercase tracking-widest text-gray-500 font-medium mb-1.5">Descripción</label>
                                <textarea
                                    value={formData.descripcion}
                                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                                    rows="3"
                                    className="w-full px-3 py-2.5 bg-black/20 border border-white/5 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-400 focus:bg-white/10 shadow-inner transition"
                                />
                            </div>

                            <div>
                                <label className="block text-[11px] uppercase tracking-widest text-gray-500 font-medium mb-1.5">Salario Base (MXN)</label>
                                <div className="relative">
                                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">$</span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={formData.salario_base}
                                        onChange={(e) => setFormData({ ...formData, salario_base: e.target.value })}
                                        className="w-full pl-7 pr-4 py-2 bg-black/20 border border-white/5 rounded-xl text-white focus:outline-none focus:border-cyan-400 focus:bg-white/10 shadow-inner transition"
                                    />
                                </div>
                            </div>

                            {puestoEditando && (
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
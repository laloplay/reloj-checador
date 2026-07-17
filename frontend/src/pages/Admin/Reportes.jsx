import { useEffect, useState } from 'react';
import { Calendar, TrendingUp, Search } from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from 'recharts';
import api from '../../services/api';

const DIAS_ES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

export function AdminReportes() {
    const [reporteDia, setReporteDia] = useState(null);
    const [reporteSemana, setReporteSemana] = useState([]);
    const [empleados, setEmpleados] = useState([]);
    const [sucursales, setSucursales] = useState([]);
    const [empleadoSeleccionado, setEmpleadoSeleccionado] = useState('');
    const [checadasEmpleado, setChecadasEmpleado] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [sucursalFiltro, setSucursalFiltro] = useState('');

    useEffect(() => {
        cargarDatos();
    }, [sucursalFiltro]);

    const cargarDatos = async () => {
        try {
            setCargando(true);
            const sucursalQuery = sucursalFiltro ? `?sucursal_id=${sucursalFiltro}` : '';

            const [diaRes, semanaRes] = await Promise.all([
                api.get(`/reportes/dia${sucursalQuery}`),
                api.get(`/reportes/semana-detalle${sucursalQuery}`),
            ]);

            setReporteDia(diaRes.data);
            const semanaConNombres = semanaRes.data.map(item => ({
                ...item,
                dia_nombre: DIAS_ES[new Date(item.dia_fecha).getDay()],
            }));
            setReporteSemana(semanaConNombres);

            // Solo cargar empleados y sucursales la primera vez
            if (empleados.length === 0) {
                const [empleadosRes, sucursalesRes] = await Promise.all([
                    api.get('/empleados'),
                    api.get('/sucursales'),
                ]);
                setEmpleados(empleadosRes.data);
                setSucursales(sucursalesRes.data);
            }
        } catch (error) {
            console.error('Error al cargar reportes:', error);
        } finally {
            setCargando(false);
        }
    };

    const buscarChecadasEmpleado = async (id) => {
        if (!id) {
            setChecadasEmpleado([]);
            return;
        }

        try {
            const { data } = await api.get(`/reportes/empleado/${id}`);
            setChecadasEmpleado(data);
        } catch (error) {
            console.error('Error al buscar checadas del empleado:', error);
        }
    };

    const handleSucursalChange = (e) => {
        setSucursalFiltro(e.target.value);
        setEmpleadoSeleccionado('');
        setChecadasEmpleado([]);
    };

    const handleEmpleadoChange = (e) => {
        const id = e.target.value;
        setEmpleadoSeleccionado(id);
        buscarChecadasEmpleado(id);
    };

    const empleadosFiltrados = sucursalFiltro
        ? empleados.filter(
              (emp) => emp.sucursal_id === sucursalFiltro
          )
        : empleados;

    const formatearFecha = (timestamp) => {
        return new Date(timestamp).toLocaleString('es-ES', {
            dateStyle: 'short',
            timeStyle: 'short',
        });
    };

    if (cargando) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-neutral-950">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p className="text-gray-400 tracking-wide">Cargando reportes...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-neutral-950 p-8">
            <div className="max-w-7xl mx-auto">
                <div className="mb-12">
                    <h1 className="text-4xl font-light text-white tracking-wide">Reportes</h1>
                    <p className="text-gray-400 text-sm mt-2">Análisis y estadísticas de asistencia</p>
                </div>

                {/* Cards de resumen */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    <div className="bg-linear-to-br from-neutral-900 to-neutral-800 border border-blue-900/30 rounded-lg p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-400 text-sm uppercase tracking-wide">Total hoy</p>
                                <p className="text-4xl font-light text-white mt-2">
                                    {reporteDia?.total_checadas || 0}
                                </p>
                            </div>
                            <Calendar className="text-blue-500 opacity-20" size={48} />
                        </div>
                    </div>

                    <div className="bg-linear-to-br from-neutral-900 to-neutral-800 border border-green-900/30 rounded-lg p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-400 text-sm uppercase tracking-wide">Entradas</p>
                                <p className="text-4xl font-light text-green-400 mt-2">
                                    {reporteDia?.entradas || 0}
                                </p>
                            </div>
                            <TrendingUp className="text-green-500 opacity-20" size={48} />
                        </div>
                    </div>

                    <div className="bg-linear-to-br from-neutral-900 to-neutral-800 border border-amber-900/30 rounded-lg p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-400 text-sm uppercase tracking-wide">Salidas</p>
                                <p className="text-4xl font-light text-amber-400 mt-2">
                                    {reporteDia?.salidas || 0}
                                </p>
                            </div>
                            <TrendingUp className="text-amber-500 opacity-20" size={48} />
                        </div>
                    </div>
                </div>

                {/* Gráfica de la semana */}
                <div className="bg-neutral-900 border border-blue-900/30 rounded-lg p-8 mb-12">
                    <h2 className="text-2xl font-light text-white tracking-wide mb-6">Checadas por día (Semana)</h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart
                            data={reporteSemana}
                            margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                            <XAxis
                                dataKey="dia_nombre"
                                stroke="#999"
                                style={{ fontSize: '12px' }}
                            />
                            <YAxis stroke="#999" style={{ fontSize: '12px' }} />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#1a1a1a',
                                    border: '1px solid #333',
                                    borderRadius: '8px',
                                    color: '#fff',
                                }}
                            />
                            <Legend />
                            <Bar dataKey="total" fill="#3b82f6" name="Total" />
                            <Bar dataKey="entradas" fill="#22c55e" name="Entradas" />
                            <Bar dataKey="salidas" fill="#eab308" name="Salidas" />
                            <Bar dataKey="retardos" fill="#ef4444" name="Retardos" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Filtro de sucursal */}
                <div className="bg-neutral-900 border border-blue-900/30 rounded-lg p-8 mb-12">
                    <h2 className="text-2xl font-light text-white tracking-wide mb-6">Filtros</h2>
                    <label className="block text-gray-300 text-sm font-medium mb-2">
                        Filtrar por sucursal
                    </label>
                    <select
                        value={sucursalFiltro}
                        onChange={handleSucursalChange}
                        className="w-full max-w-sm px-4 py-2 bg-neutral-800 border border-blue-900/40 rounded-lg text-white focus:outline-none focus:border-blue-600 transition"
                    >
                        <option value="">Todas las sucursales</option>
                        {sucursales.map((suc) => (
                            <option key={suc.id} value={suc.id}>
                                {suc.nombre}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Selector de empleado y tabla */}
                <div className="bg-neutral-900 border border-blue-900/30 rounded-lg p-8">
                    <div className="mb-6">
                        <label className="block text-gray-300 text-sm font-medium mb-2">
                            Buscar checadas por empleado
                        </label>
                        <div className="relative">
                            <Search className="absolute left-3 top-3 text-gray-500" size={20} />
                            <select
                                value={empleadoSeleccionado}
                                onChange={handleEmpleadoChange}
                                className="w-full pl-10 pr-4 py-2 bg-neutral-800 border border-blue-900/40 rounded-lg text-white focus:outline-none focus:border-blue-600 transition"
                            >
                                <option value="">Selecciona un empleado...</option>
                                {empleadosFiltrados.map((emp) => (
                                    <option key={emp.id} value={emp.id}>
                                        {emp.nombre} {emp.apellido} ({emp.numero_empleado})
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {empleadoSeleccionado && (
                        <div className="overflow-x-auto">
                            {checadasEmpleado.length === 0 ? (
                                <div className="text-center py-8">
                                    <p className="text-gray-400 tracking-wide">
                                        Este empleado no tiene checadas registradas
                                    </p>
                                </div>
                            ) : (
                                <table className="w-full border-collapse">
                                    <thead>
                                        <tr className="border-b border-blue-900/20">
                                            <th className="text-left py-4 px-4 text-gray-300 font-medium text-sm uppercase tracking-widest">
                                                Fecha/Hora
                                            </th>
                                            <th className="text-left py-4 px-4 text-gray-300 font-medium text-sm uppercase tracking-widest">
                                                Tipo
                                            </th>
                                            <th className="text-left py-4 px-4 text-gray-300 font-medium text-sm uppercase tracking-widest">
                                                Bono
                                            </th>
                                            <th className="text-left py-4 px-4 text-gray-300 font-medium text-sm uppercase tracking-widest">
                                                Retardo
                                            </th>
                                            <th className="text-left py-4 px-4 text-gray-300 font-medium text-sm uppercase tracking-widest">
                                                Confianza
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {checadasEmpleado.map((checada) => (
                                            <tr
                                                key={checada.id}
                                                className="border-b border-blue-900/10 hover:bg-blue-900/5 transition"
                                            >
                                                <td className="py-4 px-4 text-white font-medium">
                                                    {formatearFecha(checada.timestamp)}
                                                </td>
                                                <td className="py-4 px-4">
                                                    <span
                                                        className={`inline-block px-3 py-1 rounded-full text-sm font-medium border ${checada.tipo === 'entrada'
                                                                ? 'bg-green-900/30 text-green-400 border-green-600/30'
                                                                : 'bg-amber-900/30 text-amber-400 border-amber-600/30'
                                                            }`}
                                                    >
                                                        {checada.tipo === 'entrada' ? 'Entrada' : 'Salida'}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-4 text-gray-400 text-sm">
                                                    {checada.tiene_bono ? (
                                                        <span className="text-green-400 font-semibold">✓ Sí</span>
                                                    ) : (
                                                        <span className="text-gray-500">✗ No</span>
                                                    )}
                                                </td>
                                                <td className="py-4 px-4 text-gray-400 text-sm">
                                                    {checada.es_retardo ? (
                                                        <span className="text-red-400 font-semibold">
                                                            ✓ Sí ({checada.minutos_diferencia} min)
                                                        </span>
                                                    ) : (
                                                        <span className="text-gray-500">✗ No</span>
                                                    )}
                                                </td>
                                                <td className="py-4 px-4 text-gray-400 font-mono text-sm">
                                                    {checada.confianza_facial
                                                        ? Number(checada.confianza_facial).toFixed(1) + '%'
                                                        : 'N/A'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

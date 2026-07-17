import { useEffect, useState } from 'react';
import api from '../../services/api';

export function AdminNomina() {
    const [tipo, setTipo] = useState('semanal');
    const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
    const [sucursalFiltro, setSucursalFiltro] = useState('');
    const [sucursales, setSucursales] = useState([]);
    const [nomina, setNomina] = useState([]);
    const [periodo, setPeriodo] = useState(null);
    const [cargando, setCargando] = useState(false);
    const [generandoPDF, setGenerandoPDF] = useState(false);

    useEffect(() => {
        const cargarSucursales = async () => {
            try {
                const res = await api.get('/sucursales');
                setSucursales(res.data);
            } catch (error) {
                console.error('Error al cargar sucursales:', error);
            }
        };
        cargarSucursales();
    }, []);

    const calcularNomina = async () => {
        setCargando(true);
        try {
            const params = new URLSearchParams({ tipo, fecha });
            if (sucursalFiltro) {
                params.append('sucursal_id', sucursalFiltro);
            }
            const { data } = await api.get(`/nomina/calcular?${params.toString()}`);
            setNomina(data.nomina);
            setPeriodo(data.periodo);
        } catch (error) {
            console.error('Error al calcular la nómina:', error);
            alert('Error al calcular la nómina.');
        } finally {
            setCargando(false);
        }
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value);
    };

    const totalAPagar = nomina.reduce((acc, emp) => acc + emp.salario_neto, 0);
    const totalFaltas = nomina.reduce((acc, emp) => acc + emp.faltas, 0);

    const exportarPDF = () => {
        setGenerandoPDF(true);
        setTimeout(() => {
            window.print();
            setGenerandoPDF(false);
        }, 300);
    };

    return (
        <div className="min-h-screen bg-neutral-950 p-8">
            <style>
                {`
                @media print {
                    body > * { display: none; }
                    #nomina-print-area, #nomina-print-area * { display: block; }
                    #nomina-print-area {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        padding: 2rem;
                        color: #000;
                        background: #fff;
                    }
                    #nomina-print-area table {
                        width: 100%;
                        border-collapse: collapse;
                        font-size: 10px;
                    }
                    #nomina-print-area th, #nomina-print-area td {
                        border: 1px solid #ccc;
                        padding: 8px;
                        text-align: left;
                    }
                    #nomina-print-area h1 { font-size: 24px; margin-bottom: 1rem; }
                    #nomina-print-area h2 { font-size: 18px; margin-bottom: 1rem; }
                    #nomina-print-area h3 { font-size: 16px; margin-bottom: 1rem; }
                }
                `}
            </style>

            <div className="max-w-7xl mx-auto">
                <div className="flex items-center justify-between mb-12">
                    <div>
                        <h1 className="text-4xl font-light text-white tracking-wide">Nómina</h1>
                        <p className="text-gray-400 text-sm mt-2">Calcula y exporta la nómina de empleados</p>
                    </div>
                    {nomina.length > 0 && (
                        <button onClick={exportarPDF} disabled={generandoPDF} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">
                            {generandoPDF ? 'Generando...' : 'Exportar a PDF'}
                        </button>
                    )}
                </div>

                {/* Filtros */}
                <div className="bg-neutral-900 border border-blue-900/30 rounded-lg p-8 mb-12">
                    <h2 className="text-2xl font-light text-white tracking-wide mb-6">Parámetros de cálculo</h2>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div>
                            <label className="block text-gray-300 text-sm font-medium mb-2">Tipo de período</label>
                            <select value={tipo} onChange={(e) => setTipo(e.target.value)} className="w-full px-4 py-2 bg-neutral-800 border border-blue-900/40 rounded-lg text-white focus:outline-none focus:border-blue-600">
                                <option value="semanal">Semanal</option>
                                <option value="quincenal">Quincenal</option>
                                <option value="mensual">Mensual</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-gray-300 text-sm font-medium mb-2">Fecha de referencia</label>
                            <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className="w-full px-4 py-2 bg-neutral-800 border border-blue-900/40 rounded-lg text-white focus:outline-none focus:border-blue-600" />
                        </div>
                        <div>
                            <label className="block text-gray-300 text-sm font-medium mb-2">Sucursal</label>
                            <select value={sucursalFiltro} onChange={(e) => setSucursalFiltro(e.target.value)} className="w-full px-4 py-2 bg-neutral-800 border border-blue-900/40 rounded-lg text-white focus:outline-none focus:border-blue-600">
                                <option value="">Todas</option>
                                {sucursales.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                            </select>
                        </div>
                        <div className="flex items-end">
                            <button onClick={calcularNomina} disabled={cargando} className="w-full py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50">
                                {cargando ? 'Calculando...' : 'Calcular Nómina'}
                            </button>
                        </div>
                    </div>
                </div>

                {cargando && <p className="text-center text-gray-400">Calculando...</p>}

                {periodo && !cargando && (
                    <>
                        {/* Resumen */}
                        <div className="bg-neutral-900 border border-blue-900/30 rounded-lg p-8 mb-12">
                            <h2 className="text-2xl font-light text-white tracking-wide mb-6">Resumen del Período</h2>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                                <div>
                                    <p className="text-gray-400 text-sm uppercase">Período</p>
                                    <p className="text-xl font-semibold text-white mt-1">{periodo.inicio} → {periodo.fin}</p>
                                </div>
                                <div>
                                    <p className="text-gray-400 text-sm uppercase">Empleados</p>
                                    <p className="text-xl font-semibold text-white mt-1">{nomina.length}</p>
                                </div>
                                <div>
                                    <p className="text-gray-400 text-sm uppercase">Total Faltas</p>
                                    <p className="text-xl font-semibold text-red-400 mt-1">{totalFaltas}</p>
                                </div>
                                <div>
                                    <p className="text-gray-400 text-sm uppercase">Total a Pagar</p>
                                    <p className="text-xl font-semibold text-green-400 mt-1">{formatCurrency(totalAPagar)}</p>
                                </div>
                            </div>
                        </div>

                        {/* Tabla de resultados */}
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="border-b border-blue-900/20">
                                        <th className="text-left py-3 px-4 text-gray-300 font-medium text-sm uppercase tracking-widest">Empleado</th>
                                        <th className="text-left py-3 px-4 text-gray-300 font-medium text-sm uppercase tracking-widest">Puesto</th>
                                        <th className="text-left py-3 px-4 text-gray-300 font-medium text-sm uppercase tracking-widest">Salario Base</th>
                                        <th className="text-left py-3 px-4 text-gray-300 font-medium text-sm uppercase tracking-widest">Días Lab.</th>
                                        <th className="text-left py-3 px-4 text-gray-300 font-medium text-sm uppercase tracking-widest">Días Trab.</th>
                                        <th className="text-left py-3 px-4 text-gray-300 font-medium text-sm uppercase tracking-widest">Faltas</th>
                                        <th className="text-left py-3 px-4 text-gray-300 font-medium text-sm uppercase tracking-widest">Descuento</th>
                                        <th className="text-left py-3 px-4 text-gray-300 font-medium text-sm uppercase tracking-widest">Salario Neto</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {nomina.map((emp) => (
                                        <tr key={emp.empleado_id} className="border-b border-blue-900/10 hover:bg-blue-900/5">
                                            <td className="py-3 px-4 text-gray-400 text-sm font-medium text-white">{emp.nombre_completo} <span className="block text-xs text-gray-500">{emp.numero_empleado}</span></td>
                                            <td className="py-3 px-4 text-gray-400 text-sm">{emp.puesto}</td>
                                            <td className="py-3 px-4 text-gray-400 text-sm">{formatCurrency(emp.salario_base)}</td>
                                            <td className="py-3 px-4 text-gray-400 text-sm text-center">{emp.dias_laborables}</td>
                                            <td className="py-3 px-4 text-gray-400 text-sm text-center">{emp.dias_trabajados}</td>
                                            <td className="py-3 px-4 text-gray-400 text-sm text-center text-red-400">{emp.faltas}</td>
                                            <td className="py-3 px-4 text-gray-400 text-sm text-red-400">{formatCurrency(emp.descuento)}</td>
                                            <td className="py-3 px-4 text-gray-400 text-sm font-semibold text-green-400">{formatCurrency(emp.salario_neto)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </div>

            {/* Área de impresión oculta */}
            <div id="nomina-print-area" style={{ display: 'none' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <h1 style={{fontSize: '2rem', fontWeight: 'bold'}}>UNIFAM</h1>
                    <div>
                        <h2 style={{ textAlign: 'right' }}>Reporte de Nómina</h2>
                        <p style={{ textAlign: 'right', fontSize: '12px' }}>Generado: {new Date().toLocaleString('es-MX')}</p>
                    </div>
                </div>

                {periodo && (
                    <div style={{ marginBottom: '1rem' }}>
                        <h3>Período de pago: {periodo.inicio} al {periodo.fin}</h3>
                    </div>
                )}

                <table>
                    <thead>
                        <tr>
                            <th>Empleado</th>
                            <th>Puesto</th>
                            <th>Salario Base</th>
                            <th>Días Lab.</th>
                            <th>Días Trab.</th>
                            <th>Faltas</th>
                            <th>Descuento</th>
                            <th>Salario Neto</th>
                        </tr>
                    </thead>
                    <tbody>
                        {nomina.map((emp) => (
                            <tr key={emp.empleado_id}>
                                <td>{emp.nombre_completo} ({emp.numero_empleado})</td>
                                <td>{emp.puesto}</td>
                                <td>{formatCurrency(emp.salario_base)}</td>
                                <td style={{ textAlign: 'center' }}>{emp.dias_laborables}</td>
                                <td style={{ textAlign: 'center' }}>{emp.dias_trabajados}</td>
                                <td style={{ textAlign: 'center' }}>{emp.faltas}</td>
                                <td>{formatCurrency(emp.descuento)}</td>
                                <td>{formatCurrency(emp.salario_neto)}</td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr>
                            <td colSpan="7" style={{ textAlign: 'right', fontWeight: 'bold' }}>Total a Pagar:</td>
                            <td style={{ fontWeight: 'bold' }}>{formatCurrency(totalAPagar)}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    );
}
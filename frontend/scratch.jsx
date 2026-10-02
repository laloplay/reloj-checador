import { FileText } from "lucide-react";

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
        <div className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.14),transparent_32%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.18),transparent_30%),radial-gradient(circle_at_bottom,rgba(15,23,42,0.96),rgba(2,6,23,1))]" />
      <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(rgba(255,255,255,0.9)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.9)_1px,transparent_1px)] bg-size-[36px_36px]" />
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

            <div className="relative mx-auto flex max-w-7xl flex-col gap-6 px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
        <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
            <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.28em] text-cyan-100">
                    <FileText size={12} />
                    Gestión financiera
                </div>
                <h1 className="mt-3 text-3xl font-medium tracking-tight text-white sm:text-4xl">Nómina</h1>
            </div>
            {nomina.length > 0 && (
                <button
                    onClick={exportarPDF}
                    disabled={generandoPDF}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-3 text-sm font-medium text-white shadow-lg shadow-green-950/30 transition hover:bg-green-500 active:scale-[0.99] sm:w-auto disabled:opacity-50"
                >
                    {generandoPDF ? 'Generando...' : 'Exportar a PDF'}
                </button>
            )}
        </div>

                {/* Filtros */}
                <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-[0_18px_60px_rgba(0,0,0,0.2)] backdrop-blur-xl sm:p-6 mb-6">
                    <h2 className="text-xl font-medium tracking-tight text-white sm:text-2xl mb-6">Parámetros de cálculo</h2>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div>
                            <label className="block text-[11px] uppercase tracking-widest text-gray-500 font-medium mb-1.5">Tipo de período</label>
                            <select value={tipo} onChange={(e) => setTipo(e.target.value)} className="w-full px-3 py-2.5 bg-black/20 border border-white/5 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-400 focus:bg-white/10 shadow-inner transition">
                                <option value="semanal">Semanal</option>
                                <option value="quincenal">Quincenal</option>
                                <option value="mensual">Mensual</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-[11px] uppercase tracking-widest text-gray-500 font-medium mb-1.5">Fecha de referencia</label>
                            <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className="w-full px-3 py-2.5 bg-black/20 border border-white/5 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-400 focus:bg-white/10 shadow-inner transition" />
                        </div>
                        <div>
                            <label className="block text-[11px] uppercase tracking-widest text-gray-500 font-medium mb-1.5">Sucursal</label>
                            <select value={sucursalFiltro} onChange={(e) => setSucursalFiltro(e.target.value)} className="w-full px-3 py-2.5 bg-black/20 border border-white/5 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-400 focus:bg-white/10 shadow-inner transition">
                                <option value="">Todas</option>
                                {sucursales.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                            </select>
                        </div>
                        <div className="flex items-end">
                            <button onClick={calcularNomina} disabled={cargando} className="w-full py-2.5 bg-cyan-600 text-white font-semibold rounded-xl shadow-lg shadow-cyan-900/20 hover:bg-cyan-500 disabled:opacity-50 transition text-sm">
                                {cargando ? 'Calculando...' : 'Calcular Nómina'}
                            </button>
                        </div>
                    </div>
                </div>

                {cargando && <p className="text-center text-gray-400">Calculando...</p>}

                {periodo && !cargando && (
                    <>
                        {/* Resumen */}
                        <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-[0_18px_60px_rgba(0,0,0,0.2)] backdrop-blur-xl sm:p-6 mb-6 mb-12">
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
                                    <tr className="border-b border-white/10">
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
                                        <tr key={emp.empleado_id} className="border-b border-white/10 hover:bg-cyan-500/5">
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
      </div>
    );
}
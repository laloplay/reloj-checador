import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  Building2,
  Calendar,
  CalendarDays,
  ClipboardList,
  Clock3,
  FileText,
  Gift,
  MinusCircle,
  Plane,
  Printer,
  RefreshCw,
  UserCheck,
  Users,
  X,
} from 'lucide-react';
import api from '../../services/api';
import { Logo } from '../../components/Logo';

const COLORES_SUCURSAL = [
  'border-cyan-500/30 bg-cyan-500/5',
  'border-emerald-500/30 bg-emerald-500/5',
  'border-violet-500/30 bg-violet-500/5',
  'border-amber-500/30 bg-amber-500/5',
  'border-rose-500/30 bg-rose-500/5',
];

const CONDICIONES = {
  puntual: { label: 'Puntual', icon: UserCheck, color: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/20', print: 'print-puntual' },
  retardo: { label: 'Retardo', icon: AlertTriangle, color: 'text-amber-300 bg-amber-500/10 border-amber-500/20', print: 'print-retardo' },
  falta: { label: 'Falta', icon: MinusCircle, color: 'text-rose-300 bg-rose-500/10 border-rose-500/20', print: 'print-falta' },
  descanso: { label: 'Descanso', icon: Calendar, color: 'text-blue-300 bg-blue-500/10 border-blue-500/20', print: 'print-descanso' },
  festivo: { label: 'Día festivo', icon: CalendarDays, color: 'text-violet-300 bg-violet-500/10 border-violet-500/20', print: 'print-festivo' },
  permiso: { label: 'Permiso', icon: FileText, color: 'text-orange-300 bg-orange-500/10 border-orange-500/20', print: 'print-permiso' },
  vacaciones: { label: 'Vacaciones', icon: Plane, color: 'text-cyan-300 bg-cyan-500/10 border-cyan-500/20', print: 'print-permiso' },
  cumpleanos: { label: 'Cumpleaños', icon: Gift, color: 'text-pink-300 bg-pink-500/10 border-pink-500/20', print: '' },
  futuro: { label: 'Futuro', icon: null, color: 'text-slate-400 bg-white/5 border-white/10', print: '' },
};

const getMonthStart = () => {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString().split('T')[0];
};

const getToday = () => new Date().toISOString().split('T')[0];

const formatearFecha = (fecha) => new Date(`${fecha}T12:00:00`).toLocaleDateString('es-MX', {
  day: '2-digit', month: '2-digit', year: 'numeric',
});

const Modal = ({ children, onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md">
    <div className="relative max-h-[calc(100vh-2rem)] w-full max-w-3xl overflow-y-auto rounded-3xl border border-white/10 bg-slate-900 p-6 shadow-2xl sm:p-8">
      {onClose && <button type="button" onClick={onClose} aria-label="Cerrar" className="absolute right-4 top-4 rounded-xl p-2 text-slate-400 hover:bg-white/10 hover:text-white"><X size={18} /></button>}
      {children}
    </div>
  </div>
);

function ModalSeleccionModo({ fechaInicio, fechaFin, setFechaInicio, setFechaFin, onSelect }) {
  const modos = [
    { id: 'individual', icon: UserCheck, title: 'Individual', text: 'Consulta el detalle de una persona.' },
    { id: 'sucursal', icon: Building2, title: 'Sucursal', text: 'Revisa a todo un equipo.' },
    { id: 'global', icon: Users, title: 'Global', text: 'Compara todas las sucursales.' },
  ];
  return <Modal>
    <div className="text-center">
      <ClipboardList className="mx-auto mb-3 text-cyan-300" size={32} />
      <h2 className="text-2xl font-semibold text-white sm:text-3xl">¿Cómo deseas ver los registros?</h2>
      <p className="mt-2 text-sm text-slate-400">Elige una vista y define el período del reporte.</p>
    </div>
    <div className="mt-7 grid gap-4 sm:grid-cols-3">
      {modos.map(({ id, icon: Icon, title, text }) => <button key={id} type="button" onClick={() => onSelect(id)} className="group rounded-2xl border border-white/10 bg-white/5 p-5 text-left transition hover:-translate-y-1 hover:border-cyan-400/40 hover:bg-cyan-500/10">
        <Icon className="mb-5 text-cyan-300 transition group-hover:scale-110" size={30} />
        <strong className="block text-lg text-white">{title}</strong>
        <span className="mt-1 block text-sm text-slate-400">{text}</span>
      </button>)}
    </div>
    <div className="mt-7 grid gap-4 sm:grid-cols-2">
      <DateInput label="Fecha de inicio" value={fechaInicio} onChange={setFechaInicio} />
      <DateInput label="Fecha de fin" value={fechaFin} onChange={setFechaFin} />
    </div>
  </Modal>;
}

function ModalFiltroIndividual({ paso, setPaso, sucursales, empleados, sucursal, setSucursal, empleado, setEmpleado, onConfirm, onClose }) {
  const empleadosDisponibles = empleados.filter((item) => item.sucursal_id === sucursal);
  return <Modal onClose={onClose}>
    <div className="mb-7 flex items-center gap-3"><UserCheck className="text-cyan-300" /><div><h2 className="text-xl font-semibold text-white">Selecciona el empleado</h2><p className="text-sm text-slate-400">Paso {paso} de 2</p></div></div>
    {paso === 1 ? <>
      <SelectInput label="Sucursal" value={sucursal} onChange={(event) => setSucursal(event.target.value)} options={sucursales} placeholder="Selecciona una sucursal" />
      <button type="button" disabled={!sucursal} onClick={() => setPaso(2)} className="mt-6 w-full rounded-xl bg-cyan-500 px-4 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-40">Siguiente <span aria-hidden="true">→</span></button>
    </> : <>
      <p className="mb-3 text-sm text-slate-400">Sucursal: <span className="font-medium text-white">{sucursales.find((item) => item.id === sucursal)?.nombre}</span></p>
      <SelectInput label="Empleado" value={empleado} onChange={(event) => setEmpleado(event.target.value)} options={empleadosDisponibles} optionLabel="nombre_completo" placeholder="Selecciona un empleado" />
      <div className="mt-6 flex gap-3"><button type="button" onClick={() => setPaso(1)} className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-3 text-sm text-white hover:bg-white/10"><ArrowLeft size={16} /> Atrás</button><button type="button" disabled={!empleado} onClick={onConfirm} className="flex-1 rounded-xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-slate-950 hover:bg-cyan-300 disabled:opacity-40">Ver registros</button></div>
    </>}
  </Modal>;
}

function ModalFiltroSucursal({ sucursales, sucursal, setSucursal, onConfirm, onClose }) {
  return <Modal onClose={onClose}><Building2 className="mb-3 text-cyan-300" /><h2 className="text-xl font-semibold text-white">Selecciona la sucursal</h2><p className="mt-1 text-sm text-slate-400">Consulta todos los empleados activos.</p><SelectInput label="Sucursal" value={sucursal} onChange={(event) => setSucursal(event.target.value)} options={sucursales} placeholder="Selecciona una sucursal" /><button type="button" disabled={!sucursal} onClick={onConfirm} className="mt-6 w-full rounded-xl bg-cyan-500 px-4 py-3 font-semibold text-slate-950 hover:bg-cyan-300 disabled:opacity-40">Ver registros</button></Modal>;
}

function DateInput({ label, value, onChange }) { return <label className="block text-left text-sm text-slate-300">{label}<input type="date" value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2.5 text-white outline-none focus:border-cyan-400" /></label>; }
function SelectInput({ label, value, onChange, options, placeholder, optionLabel = 'nombre' }) { return <label className="block text-left text-sm text-slate-300">{label}<select value={value} onChange={onChange} className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2.5 text-white outline-none focus:border-cyan-400"><option value="">{placeholder}</option>{options.map((option) => <option key={option.id} value={option.id}>{option[optionLabel]}</option>)}</select></label>; }

function StatCard({ label, value, color = 'text-white' }) { return <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center"><p className={`text-3xl font-semibold ${color}`}>{value ?? 0}</p><p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-slate-400">{label}</p></div>; }

export function TablaEmpleado({ empleado, dias, estadisticas }) {
  return <section className="rounded-2xl border border-white/10 bg-slate-900/70 p-4 sm:p-6">
    <header className="mb-5 flex flex-wrap items-start justify-between gap-3"><div><h3 className="text-xl font-semibold text-white">{empleado.nombre_completo}</h3><p className="mt-1 text-sm text-slate-400">{empleado.puesto_nombre || 'Sin puesto'} · {empleado.turno_hora_inicio || '--:--'} - {empleado.turno_hora_fin || '--:--'}</p></div><span className="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-1 text-xs text-cyan-200">{empleado.sucursal_nombre || 'Sin sucursal'}</span></header>
    <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-5"><StatCard label="Entradas" value={estadisticas?.total_entradas} color="text-emerald-300" /><StatCard label="Salidas" value={estadisticas?.total_salidas} /><StatCard label="Retardos" value={estadisticas?.total_retardos} color="text-amber-300" /><StatCard label="Bonos" value={estadisticas?.total_bonos} color="text-cyan-300" /><StatCard label="Faltas" value={estadisticas?.total_faltas} color="text-rose-300" /></div>
    <div className="space-y-2">{dias?.map((dia) => <DiaRow key={dia.fecha} dia={dia} />)}</div>
  </section>;
}

function DiaRow({ dia }) {
  const condicion = dia.condiciones?.[0];
  const config = CONDICIONES[condicion?.tipo] || CONDICIONES.futuro;
  return <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/2 px-3 py-3"><div className="flex min-w-0 items-center gap-3"><div className="w-10 shrink-0 text-center"><strong className="block text-lg text-white">{dia.dia_num}</strong><span className="text-[10px] capitalize text-slate-500">{dia.dia_semana?.slice(0, 3)}</span></div><div className="flex min-w-0 flex-wrap gap-1.5">{dia.condiciones?.map((item, index) => { const itemConfig = CONDICIONES[item.tipo] || config; const ItemIcon = itemConfig.icon; return <span key={`${item.tipo}-${index}`} title={item.motivo || itemConfig.label} className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium ${itemConfig.color}`}>{ItemIcon && <ItemIcon size={13} />}{item.label}</span>; })}</div></div><div className="flex shrink-0 items-center gap-3 text-xs text-slate-400"><span className="font-mono">{dia.hora_entrada || '--:--'} → {dia.hora_salida || '--:--'}</span>{dia.tiene_bono && <Gift className="text-amber-300" size={16} />}</div></div>;
}

function PrintArea({ modo, datos, fechaInicio, fechaFin }) {
  if (!datos) return <div id="registros-print-area" style={{ display: 'none' }} />;
  const grupos = modo === 'individual' ? [{ sucursal: { nombre: datos.empleado.sucursal_nombre }, empleados: [datos] }] : datos;
  return <div id="registros-print-area" style={{ display: 'none' }}><div className="print-header"><Logo /><div><h1>Reporte de Asistencia</h1><p>Período: {formatearFecha(fechaInicio)} → {formatearFecha(fechaFin)}</p><p>Generado: {new Date().toLocaleString('es-MX')}</p></div></div>{grupos.map((grupo, index) => <section key={`${grupo.sucursal?.id || 'sin'}-${index}`} className={`print-sucursal-section ${index === 0 ? 'first' : ''}`}><h2>{grupo.sucursal?.nombre || 'Sin sucursal'}</h2>{grupo.empleados.map((item) => <div key={item.empleado.id} className="print-empleado-section"><h3>{item.empleado.nombre_completo}</h3><p>{item.empleado.puesto_nombre || 'Sin puesto'} · Turno: {item.empleado.turno_hora_inicio || '--:--'} - {item.empleado.turno_hora_fin || '--:--'}</p><p>Entradas: {item.estadisticas.total_entradas} | Salidas: {item.estadisticas.total_salidas} | Retardos: {item.estadisticas.total_retardos} | Faltas: {item.estadisticas.total_faltas}</p><table className="print-tabla"><thead><tr><th>Fecha</th><th>Día</th><th>Estado</th><th>Hora entrada</th><th>Hora salida</th><th>Observaciones</th></tr></thead><tbody>{item.dias.map((dia) => { const tipo = dia.condiciones?.[0]?.tipo; const estado = dia.condiciones?.map((condicion) => condicion.label).join(', ') || 'Sin estado'; return <tr key={dia.fecha} className={CONDICIONES[tipo]?.print || ''}><td>{formatearFecha(dia.fecha)}</td><td>{dia.dia_semana}</td><td>{estado}</td><td>{dia.hora_entrada || '--:--'}</td><td>{dia.hora_salida || '--:--'}</td><td>{dia.condiciones?.map((condicion) => condicion.motivo).filter(Boolean).join('; ') || ''}</td></tr>; })}</tbody></table></div>)}</section>)}</div>;
}

export function AdminRegistros() {
  const [modalSeleccionAbierto, setModalSeleccionAbierto] = useState(true);
  const [modo, setModo] = useState(null);
  const [paso, setPaso] = useState(1);
  const [sucursalSeleccionada, setSucursalSeleccionada] = useState('');
  const [empleadoSeleccionado, setEmpleadoSeleccionado] = useState('');
  const [fechaInicio, setFechaInicio] = useState(getMonthStart());
  const [fechaFin, setFechaFin] = useState(getToday());
  const [datos, setDatos] = useState(null);
  const [sucursales, setSucursales] = useState([]);
  const [empleados, setEmpleados] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => { Promise.all([api.get('/sucursales'), api.get('/empleados')]).then(([sucursalesRes, empleadosRes]) => { setSucursales(sucursalesRes.data.filter((item) => item.activo)); setEmpleados(empleadosRes.data.filter((item) => item.activo)); }).catch(() => setError('No se pudieron cargar los catálogos.')); }, []);

  const cargarDatos = async (tipo, sucursalId = '', empleadoId = '') => {
    setCargando(true); setError(null);
    try {
      const params = new URLSearchParams({ fecha_inicio: fechaInicio, fecha_fin: fechaFin });
      if (sucursalId) params.set('sucursal_id', sucursalId);
      const response = await api.get(`/registros/por-sucursal?${params.toString()}`);
      const grupos = response.data;
      if (tipo === 'individual') {
        const grupo = grupos.find((item) => item.empleados.some((registro) => registro.empleado.id === empleadoId));
        setDatos(grupo?.empleados.find((item) => item.empleado.id === empleadoId) || null);
      } else setDatos(grupos);
      setModo(tipo); setModalSeleccionAbierto(false);
    } catch (requestError) { console.error('Error al cargar registros:', requestError); setError('No se pudieron cargar los registros del período.'); } finally { setCargando(false); }
  };

  const seleccionarModo = (tipo) => { setModo(tipo); if (tipo === 'global') cargarDatos('global'); else setModalSeleccionAbierto(false); };
  const reiniciar = () => { setDatos(null); setModo(null); setPaso(1); setSucursalSeleccionada(''); setEmpleadoSeleccionado(''); setModalSeleccionAbierto(true); };
  const titulo = useMemo(() => ({ individual: 'Vista individual', sucursal: 'Vista por sucursal', global: 'Vista global' }[modo] || 'Registros'), [modo]);

  return <div className="min-h-screen bg-slate-950 p-4 text-white sm:p-8"><div className="mx-auto max-w-7xl"><header className="mb-8 flex flex-wrap items-center justify-between gap-4"><div><p className="text-xs uppercase tracking-[0.28em] text-cyan-300">Asistencia</p><h1 className="mt-2 text-3xl font-semibold">{titulo}</h1><p className="mt-1 text-sm text-slate-400">{formatearFecha(fechaInicio)} → {formatearFecha(fechaFin)}</p></div><button type="button" onClick={reiniciar} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white hover:bg-white/10"><RefreshCw size={16} /> Cambiar vista</button></header>
    {error && <div className="mb-6 rounded-xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</div>}
    {cargando && <div className="flex min-h-64 items-center justify-center"><Clock3 className="mr-3 animate-spin text-cyan-300" /> Cargando registros...</div>}
    {!cargando && datos && <div className="space-y-6">{modo === 'individual' ? <TablaEmpleado {...datos} /> : datos.map((grupo, index) => <section key={`${grupo.sucursal?.id || 'sin'}-${index}`} className={`rounded-3xl border p-4 sm:p-6 ${COLORES_SUCURSAL[index % COLORES_SUCURSAL.length]}`}><h2 className="mb-5 flex items-center gap-2 text-xl font-semibold text-white"><Building2 size={20} /> {grupo.sucursal?.nombre || 'Sin sucursal'}</h2><div className="space-y-6">{grupo.empleados.map((item) => <TablaEmpleado key={item.empleado.id} {...item} />)}</div></section>)}</div>}
    {!cargando && !datos && !error && <div className="rounded-2xl border border-dashed border-white/10 p-12 text-center text-slate-400">No hay empleados o registros para el período seleccionado.</div>}
  </div>{modalSeleccionAbierto && <ModalSeleccionModo fechaInicio={fechaInicio} fechaFin={fechaFin} setFechaInicio={setFechaInicio} setFechaFin={setFechaFin} onSelect={seleccionarModo} />}{modo === 'individual' && !datos && !modalSeleccionAbierto && <ModalFiltroIndividual paso={paso} setPaso={setPaso} sucursales={sucursales} empleados={empleados} sucursal={sucursalSeleccionada} setSucursal={setSucursalSeleccionada} empleado={empleadoSeleccionado} setEmpleado={setEmpleadoSeleccionado} onConfirm={() => cargarDatos('individual', sucursalSeleccionada, empleadoSeleccionado)} onClose={reiniciar} />}{modo === 'sucursal' && !datos && !modalSeleccionAbierto && <ModalFiltroSucursal sucursales={sucursales} sucursal={sucursalSeleccionada} setSucursal={setSucursalSeleccionada} onConfirm={() => cargarDatos('sucursal', sucursalSeleccionada)} onClose={reiniciar} />}{datos && <><button type="button" onClick={() => window.print()} className="fixed bottom-6 right-6 z-30 inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-950/40 transition hover:bg-blue-700"><Printer size={18} /> Imprimir reporte</button><PrintArea modo={modo} datos={datos} fechaInicio={fechaInicio} fechaFin={fechaFin} /></>}</div>;
}

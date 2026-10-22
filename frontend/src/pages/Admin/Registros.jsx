import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Building,
  Calendar,
  CalendarDays,
  ClipboardList,
  Clock3,
  Eye,
  FileText,
  Gift,
  MinusCircle,
  Plane,
  Printer,
  Search,
  UserCheck,
  Users,
  X,
} from 'lucide-react';
import api from '../../services/api';

const LOGO_URL = 'https://i.postimg.cc/wvfqWVVS/LGO-SVG.png';

const CONDICIONES = {
  puntual: {
    label: 'Puntual',
    icon: UserCheck,
    color: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/20',
    badgeClass: 'badge-puntual',
  },
  retardo: {
    label: 'Retardo',
    icon: AlertTriangle,
    color: 'text-amber-300 bg-amber-500/10 border-amber-500/20',
    badgeClass: 'badge-retardo',
  },
  falta: {
    label: 'Falta',
    icon: MinusCircle,
    color: 'text-rose-300 bg-rose-500/10 border-rose-500/20',
    badgeClass: 'badge-falta',
  },
  descanso: {
    label: 'Descanso',
    icon: Calendar,
    color: 'text-blue-300 bg-blue-500/10 border-blue-500/20',
    badgeClass: 'badge-descanso',
  },
  festivo: {
    label: 'Día festivo',
    icon: CalendarDays,
    color: 'text-violet-300 bg-violet-500/10 border-violet-500/20',
    badgeClass: 'badge-festivo',
  },
  permiso: {
    label: 'Permiso',
    icon: FileText,
    color: 'text-orange-300 bg-orange-500/10 border-orange-500/20',
    badgeClass: 'badge-permiso',
  },
  vacaciones: {
    label: 'Vacaciones',
    icon: Plane,
    color: 'text-cyan-300 bg-cyan-500/10 border-cyan-500/20',
    badgeClass: 'badge-vacaciones',
  },
  cumpleanos: {
    label: 'Cumpleaños',
    icon: Gift,
    color: 'text-pink-300 bg-pink-500/10 border-pink-500/20',
    badgeClass: 'badge-cumpleanos',
  },
  futuro: {
    label: 'Futuro',
    icon: null,
    color: 'text-slate-400 bg-white/5 border-white/10',
    badgeClass: 'badge-futuro',
  },
};

const toLocalISODate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getToday = () => toLocalISODate(new Date());

const getLastWeekStart = () => {
  const date = new Date();
  date.setDate(date.getDate() - 6);
  return toLocalISODate(date);
};

const getFortnightStart = () => {
  const date = new Date();
  date.setDate(date.getDate() - 14);
  return toLocalISODate(date);
};

const getMonthStart = () => {
  const now = new Date();
  return toLocalISODate(new Date(now.getFullYear(), now.getMonth(), 1));
};

const formatearFecha = (fecha) => {
  if (!fecha) return '--/--/----';
  return new Date(`${fecha}T12:00:00`).toLocaleDateString('es-MX', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

const escapeHtml = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

function generarDocumentoReporte({
  empleados,
  fechaInicio,
  fechaFin,
  sucursalNombre,
  busquedaNombre,
}) {
  const gruposMap = new Map();
  let totalEntradasGlobal = 0;
  let totalSalidasGlobal = 0;
  let totalRetardosGlobal = 0;
  let totalFaltasGlobal = 0;
  let totalBonosGlobal = 0;

  empleados.forEach((item) => {
    const key = item.empleado.sucursal_id || 'sin-sucursal';
    if (!gruposMap.has(key)) {
      gruposMap.set(key, {
        nombre: item.empleado.sucursal_nombre || 'Sin sucursal asignada',
        empleados: [],
      });
    }
    gruposMap.get(key).empleados.push(item);

    const dias = item.dias || [];
    const bonosEmp = dias.filter((d) => d.tiene_bono).length;

    totalEntradasGlobal += Number(item.estadisticas?.total_entradas || 0);
    totalSalidasGlobal += Number(item.estadisticas?.total_salidas || 0);
    totalRetardosGlobal += Number(item.estadisticas?.total_retardos || 0);
    totalFaltasGlobal += Number(item.estadisticas?.total_faltas || 0);
    totalBonosGlobal += bonosEmp;
  });

  const grupos = [...gruposMap.values()];
  const fechaEmision = new Date().toLocaleString('es-MX', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  const seccionesHtml = grupos
    .map((grupo) => {
      const filasEmpleados = grupo.empleados
        .map((item, idx) => {
          const emp = item.empleado;
          const est = item.estadisticas || {};
          const dias = item.dias || [];

          const totalBonos = dias.filter((d) => d.tiene_bono).length;
          const totalPuntuales = dias.filter((d) =>
            d.condiciones?.some((c) => c.tipo === 'puntual')
          ).length;
          const totalDescansos = dias.filter((d) =>
            d.condiciones?.some((c) =>
              ['descanso', 'festivo', 'permiso', 'vacaciones'].includes(c.tipo)
            )
          ).length;

          const formatHoraCorta = (hora) =>
            hora ? String(hora).replace(/^(\d{2}:\d{2}):\d{2}$/, '$1') : '';

          const horario =
            emp.turno_hora_inicio && emp.turno_hora_fin
              ? `${formatHoraCorta(emp.turno_hora_inicio)} – ${formatHoraCorta(
                  emp.turno_hora_fin
                )}`
              : 'Sin turno';

          return `
            <tr>
              <td class="col-num">${idx + 1}</td>
              <td class="col-emp">
                <div class="emp-name">${escapeHtml(emp.nombre_completo)}</div>
                <div class="emp-role">${escapeHtml(emp.puesto_nombre || 'Sin puesto')}</div>
              </td>
              <td class="col-horario">${escapeHtml(horario)}</td>
              <td class="col-metric">
                <span class="metric-pill pill-sage">${est.total_entradas ?? 0}</span>
              </td>
              <td class="col-metric">
                <span class="metric-pill pill-blue">${est.total_salidas ?? 0}</span>
              </td>
              <td class="col-metric">
                <span class="metric-pill pill-neutral">${totalPuntuales}</span>
              </td>
              <td class="col-metric">
                <span class="metric-pill ${
                  (est.total_retardos ?? 0) > 0 ? 'pill-amber' : 'pill-neutral'
                }">${est.total_retardos ?? 0}</span>
              </td>
              <td class="col-metric">
                <span class="metric-pill ${
                  (est.total_faltas ?? 0) > 0 ? 'pill-rose' : 'pill-neutral'
                }">${est.total_faltas ?? 0}</span>
              </td>
              <td class="col-metric">
                <span class="metric-pill pill-neutral">${totalDescansos}</span>
              </td>
              <td class="col-metric">
                <span class="metric-pill ${
                  totalBonos > 0 ? 'pill-soft-blue' : 'pill-neutral'
                }">${totalBonos}</span>
              </td>
            </tr>
          `;
        })
        .join('');

      return `
        <div class="branch-section">
          <div class="branch-banner">
            <div class="branch-title-wrap">
              <span class="branch-tag">Sucursal</span>
              <h2>${escapeHtml(grupo.nombre)}</h2>
            </div>
            <span class="branch-count">${grupo.empleados.length} ${
              grupo.empleados.length === 1 ? 'colaborador' : 'colaboradores'
            }</span>
          </div>

          <table class="summary-table">
            <thead>
              <tr>
                <th class="col-num">#</th>
                <th class="col-emp">Colaborador / Puesto</th>
                <th class="col-horario">Horario</th>
                <th class="col-metric">Entradas</th>
                <th class="col-metric">Salidas</th>
                <th class="col-metric">Puntuales</th>
                <th class="col-metric">Retardos</th>
                <th class="col-metric">Faltas</th>
                <th class="col-metric">Desc. / Perm.</th>
                <th class="col-metric">Bonos</th>
              </tr>
            </thead>
            <tbody>
              ${filasEmpleados}
            </tbody>
          </table>
        </div>
      `;
    })
    .join('');

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>&nbsp;</title>
  <style>
    /* Tamaño Carta con margin: 0 para suprimir textos del navegador y aprovechar todo el ancho */
    @page {
      size: letter portrait;
      margin: 0;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    html, body {
      width: 100%;
      margin: 0;
      padding: 0;
    }
    body {
      padding: 6mm 6mm;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #2c3e50;
      background: #ffffff;
      font-size: 11px;
      line-height: 1.4;
    }
    .doc-container {
      width: 100%;
      max-width: 100%;
    }

    /* Encabezado Corporativo en tonos bajos y suaves */
    .doc-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
      background: #f4f7fa;
      color: #2c3e50;
      padding: 12px 16px;
      border-radius: 10px;
      border: 1px solid #dce4ec;
      border-bottom: 2px solid #8fa4b8;
      margin-bottom: 12px;
    }
    .brand-block {
      display: flex;
      align-items: center;
      gap: 14px;
    }
    .brand-logo {
      height: 42px;
      width: auto;
      object-fit: contain;
      display: block;
    }
    .brand-divider {
      width: 1px;
      height: 34px;
      background: #cfd9e3;
    }
    .doc-title-block h1 {
      margin: 0;
      font-size: 15.5px;
      font-weight: 700;
      letter-spacing: 0.03em;
      text-transform: uppercase;
      color: #2b3d4f;
    }
    .doc-title-block p {
      margin: 2px 0 0;
      font-size: 10.5px;
      color: #64748b;
    }
    .doc-meta {
      text-align: right;
      font-size: 10px;
      color: #526375;
      line-height: 1.45;
      white-space: nowrap;
      flex-shrink: 0;
    }
    .doc-meta strong {
      color: #3b536b;
      font-weight: 600;
    }

    /* Barra de Resumen Ejecutivo (Colores bajos) */
    .summary-bar {
      display: grid;
      grid-template-columns: repeat(6, 1fr);
      gap: 8px;
      margin-bottom: 12px;
    }
    .summary-item {
      background: #f9fbfd;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 7px 10px;
      text-align: center;
    }
    .summary-item .num {
      display: block;
      font-size: 15.5px;
      font-weight: 700;
      color: #334155;
    }
    .summary-item .lbl {
      display: block;
      margin-top: 1px;
      font-size: 8.5px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: #64748b;
    }
    .num-sage { color: #3d6b58 !important; }
    .num-blue { color: #4a6984 !important; }
    .num-amber { color: #8c6239 !important; }
    .num-rose { color: #8c4650 !important; }

    /* Sección de Sucursal */
    .branch-section {
      margin-bottom: 14px;
      page-break-inside: avoid;
    }
    .branch-banner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      background: #eef3f7;
      border: 1px solid #dce4ec;
      border-left: 3px solid #758da3;
      padding: 6px 12px;
      border-radius: 6px 6px 0 0;
    }
    .branch-title-wrap {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .branch-tag {
      font-size: 8.5px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      background: #dce6f0;
      color: #41586e;
      padding: 2px 6px;
      border-radius: 4px;
    }
    .branch-banner h2 {
      margin: 0;
      font-size: 12px;
      font-weight: 700;
      color: #2b3d4f;
    }
    .branch-count {
      font-size: 9.5px;
      font-weight: 600;
      color: #5c7085;
    }

    /* Tabla Compacta de Colaboradores */
    .summary-table {
      width: 100%;
      border-collapse: collapse;
      border: 1px solid #dce4ec;
      border-top: none;
      font-size: 10.5px;
      background: #ffffff;
    }
    .summary-table th {
      background: #f6f8fb;
      color: #475569;
      font-weight: 700;
      text-transform: uppercase;
      font-size: 8.5px;
      letter-spacing: 0.05em;
      padding: 7px 10px;
      border-bottom: 1px solid #dce4ec;
      text-align: left;
      white-space: nowrap;
    }
    .summary-table td {
      padding: 7px 10px;
      border-bottom: 1px solid #edf2f7;
      color: #334155;
      vertical-align: middle;
    }
    .summary-table tbody tr:nth-child(even) td {
      background: #fafcfe;
    }
    .summary-table tbody tr:last-child td {
      border-bottom: none;
    }
    .col-num {
      width: 30px;
      text-align: center !important;
      color: #94a3b8 !important;
      font-weight: 600;
    }
    .col-emp {
      width: 30%;
    }
    .emp-name {
      font-weight: 600;
      color: #1e293b;
      font-size: 11px;
    }
    .emp-role {
      font-size: 9.5px;
      color: #64748b;
      margin-top: 1px;
    }
    .col-horario {
      width: 110px;
      white-space: nowrap;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 10px;
      color: #475569;
    }
    .col-metric {
      text-align: center !important;
      white-space: nowrap;
    }

    /* Pastillas de métricas en tonos pastel bajos */
    .metric-pill {
      display: inline-block;
      min-width: 28px;
      padding: 2px 7px;
      border-radius: 5px;
      font-size: 10px;
      font-weight: 600;
      text-align: center;
      font-variant-numeric: tabular-nums;
    }
    .pill-neutral {
      background: #f3f6f9;
      color: #526375;
      border: 1px solid #e2e8f0;
    }
    .pill-sage {
      background: #eff6f2;
      color: #386652;
      border: 1px solid #d5e6dd;
    }
    .pill-blue {
      background: #eff4f9;
      color: #426280;
      border: 1px solid #d6e2ee;
    }
    .pill-soft-blue {
      background: #edf3f8;
      color: #3b5975;
      border: 1px solid #cbdceb;
    }
    .pill-amber {
      background: #fbf6ee;
      color: #855d33;
      border: 1px solid #ebd9be;
    }
    .pill-rose {
      background: #faeff0;
      color: #8a434d;
      border: 1px solid #ebcfd3;
    }

    /* Pie de firmas */
    .doc-footer {
      margin-top: 22px;
      padding-top: 12px;
      border-top: 1px solid #dce4ec;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      page-break-inside: avoid;
      font-size: 9.5px;
      color: #64748b;
    }
    .signature-box {
      text-align: center;
      width: 200px;
    }
    .signature-line {
      border-bottom: 1px solid #64748b;
      height: 26px;
      margin-bottom: 5px;
    }
  </style>
</head>
<body>
  <div class="doc-container">
    <header class="doc-header">
      <div class="brand-block">
        <img src="${LOGO_URL}" alt="UNIFAM" class="brand-logo" crossorigin="anonymous" />
        <div class="brand-divider"></div>
        <div class="doc-title-block">
          <h1>Reporte Ejecutivo de Asistencia</h1>
          <p>Resumen concentrado de asistencias e incidencias de personal</p>
        </div>
      </div>
      <div class="doc-meta">
        <div><strong>Período:</strong> ${escapeHtml(formatearFecha(fechaInicio))} al ${escapeHtml(
          formatearFecha(fechaFin)
        )}</div>
        <div><strong>Sucursal:</strong> ${escapeHtml(sucursalNombre)}</div>
        ${
          busquedaNombre
            ? `<div><strong>Filtro:</strong> "${escapeHtml(busquedaNombre)}"</div>`
            : ''
        }
        <div><strong>Emisión:</strong> ${escapeHtml(fechaEmision)}</div>
      </div>
    </header>

    <section class="summary-bar">
      <div class="summary-item">
        <span class="num">${empleados.length}</span>
        <span class="lbl">Colaboradores</span>
      </div>
      <div class="summary-item">
        <span class="num num-sage">${totalEntradasGlobal}</span>
        <span class="lbl">Entradas</span>
      </div>
      <div class="summary-item">
        <span class="num num-blue">${totalSalidasGlobal}</span>
        <span class="lbl">Salidas</span>
      </div>
      <div class="summary-item">
        <span class="num num-amber">${totalRetardosGlobal}</span>
        <span class="lbl">Retardos</span>
      </div>
      <div class="summary-item">
        <span class="num num-rose">${totalFaltasGlobal}</span>
        <span class="lbl">Faltas</span>
      </div>
      <div class="summary-item">
        <span class="num num-blue">${totalBonosGlobal}</span>
        <span class="lbl">Bonos</span>
      </div>
    </section>

    ${seccionesHtml}

    <footer class="doc-footer">
      <div>
        Sistema de Control de Asistencia <strong>UNIFAM</strong> · Reporte concentrado por período
      </div>
      <div class="signature-box">
        <div class="signature-line"></div>
        <strong>Revisó / Recursos Humanos</strong>
      </div>
    </footer>
  </div>
</body>
</html>`;
}

function StatCard({ label, value, color = 'text-white' }) {
  return (
    <div className="rounded-2xl border border-white/5 bg-black/20 p-3.5 text-center shadow-inner">
      <p className={`text-2xl font-semibold ${color}`}>{value ?? 0}</p>
      <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-slate-400">{label}</p>
    </div>
  );
}

function DiaRow({ dia }) {
  const condicion = dia.condiciones?.[0];
  const config = CONDICIONES[condicion?.tipo] || CONDICIONES.futuro;
  return (
    <div className="flex flex-col justify-between gap-2.5 rounded-xl border border-white/5 bg-black/20 px-3.5 py-3 shadow-inner sm:flex-row sm:items-center">
      <div className="flex min-w-0 items-center gap-3">
        <div className="w-11 shrink-0 rounded-xl border border-white/10 bg-white/4 py-1.5 text-center">
          <strong className="block text-base leading-none text-white">{dia.dia_num}</strong>
          <span className="mt-0.5 block text-[10px] uppercase tracking-wider text-slate-400">
            {dia.dia_semana?.slice(0, 3)}
          </span>
        </div>
        <div className="flex min-w-0 flex-wrap gap-1.5">
          {dia.condiciones?.map((item, index) => {
            const itemConfig = CONDICIONES[item.tipo] || config;
            const ItemIcon = itemConfig.icon;
            return (
              <span
                key={`${item.tipo}-${index}`}
                title={item.motivo || itemConfig.label}
                className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-medium ${itemConfig.color}`}
              >
                {ItemIcon && <ItemIcon size={13} />}
                {item.label}
              </span>
            );
          })}
        </div>
      </div>

      <div className="flex shrink-0 items-center justify-end gap-3 border-t border-white/5 pt-2 text-xs text-slate-300 sm:border-t-0 sm:pt-0">
        <span className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 font-mono text-xs text-slate-200">
          {dia.hora_entrada || '--:--'} → {dia.hora_salida || '--:--'}
        </span>
        {dia.tiene_bono && (
          <span
            title="Bono de puntualidad"
            className="inline-flex items-center gap-1 rounded-lg border border-amber-400/20 bg-amber-500/10 px-2 py-1 text-[11px] font-medium text-amber-300"
          >
            <Gift size={13} />
            Bono
          </span>
        )}
      </div>
    </div>
  );
}

export function AdminRegistros() {
  const [fechaInicio, setFechaInicio] = useState(getLastWeekStart);
  const [fechaFin, setFechaFin] = useState(getToday);
  const [busquedaNombre, setBusquedaNombre] = useState('');
  const [sucursalFiltro, setSucursalFiltro] = useState('');
  const [sucursales, setSucursales] = useState([]);
  const [grupos, setGrupos] = useState([]);
  const [empleadoModal, setEmpleadoModal] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [generandoReporte, setGenerandoReporte] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    api
      .get('/sucursales')
      .then((res) => {
        setSucursales(res.data.filter((item) => item.activo));
      })
      .catch((err) => {
        console.error('Error al cargar sucursales:', err);
      });
  }, []);

  useEffect(() => {
    if (!fechaInicio || !fechaFin) return;
    if (fechaInicio > fechaFin) {
      setError('La fecha de inicio no puede ser mayor que la fecha de fin.');
      return;
    }

    const cargarRegistros = async () => {
      setCargando(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          fecha_inicio: fechaInicio,
          fecha_fin: fechaFin,
        });
        const response = await api.get(`/registros/por-sucursal?${params.toString()}`);
        setGrupos(Array.isArray(response.data) ? response.data : []);
      } catch (requestError) {
        console.error('Error al cargar registros:', requestError);
        setError('No se pudieron cargar los registros del período seleccionado.');
      } finally {
        setCargando(false);
      }
    };

    cargarRegistros();
  }, [fechaInicio, fechaFin]);

  const listaEmpleados = useMemo(() => {
    return grupos.flatMap((grupo) =>
      (grupo.empleados || []).map((item) => ({
        ...item,
        empleado: {
          ...item.empleado,
          sucursal_id: item.empleado.sucursal_id ?? grupo.sucursal?.id ?? null,
          sucursal_nombre:
            item.empleado.sucursal_nombre || grupo.sucursal?.nombre || 'Sin sucursal',
        },
      }))
    );
  }, [grupos]);

  const empleadosFiltrados = useMemo(() => {
    const query = busquedaNombre.trim().toLowerCase();
    return listaEmpleados.filter(({ empleado }) => {
      const coincideNombre = (empleado.nombre_completo || '')
        .toLowerCase()
        .includes(query);
      const coincideSucursal =
        !sucursalFiltro ||
        (sucursalFiltro === 'sin_asignar'
          ? !empleado.sucursal_id
          : String(empleado.sucursal_id) === String(sucursalFiltro));
      return coincideNombre && coincideSucursal;
    });
  }, [listaEmpleados, busquedaNombre, sucursalFiltro]);

  const aplicarRangoRapido = (tipo) => {
    const hoy = getToday();
    if (tipo === 'semana') {
      setFechaInicio(getLastWeekStart());
      setFechaFin(hoy);
    } else if (tipo === 'quincena') {
      setFechaInicio(getFortnightStart());
      setFechaFin(hoy);
    } else if (tipo === 'mes') {
      setFechaInicio(getMonthStart());
      setFechaFin(hoy);
    }
  };

  const imprimirReporteGeneral = () => {
    if (empleadosFiltrados.length === 0) return;

    setGenerandoReporte(true);

    const sucursalNombre = !sucursalFiltro
      ? 'Todas las sucursales'
      : sucursalFiltro === 'sin_asignar'
        ? 'Sin sucursal asignada'
        : sucursales.find((s) => String(s.id) === String(sucursalFiltro))?.nombre ||
          'Sucursal seleccionada';

    const html = generarDocumentoReporte({
      empleados: empleadosFiltrados,
      fechaInicio,
      fechaFin,
      sucursalNombre,
      busquedaNombre: busquedaNombre.trim(),
    });

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(html);
    doc.close();

    const ejecutarImpresion = () => {
      const tituloOriginal = document.title;
      try {
        document.title = ' ';
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
      } finally {
        document.title = tituloOriginal;
        setGenerandoReporte(false);
        setTimeout(() => {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
        }, 1500);
      }
    };

    const img = doc.querySelector('img.brand-logo');
    if (img && !img.complete) {
      img.onload = () => setTimeout(ejecutarImpresion, 150);
      img.onerror = () => setTimeout(ejecutarImpresion, 150);
    } else {
      setTimeout(ejecutarImpresion, 200);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.14),transparent_32%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.18),transparent_30%),radial-gradient(circle_at_bottom,rgba(15,23,42,0.96),rgba(2,6,23,1))]" />
      <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(rgba(255,255,255,0.9)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.9)_1px,transparent_1px)] bg-size-[36px_36px]" />

      <div className="relative mx-auto flex max-w-7xl flex-col gap-6 px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
        {/* Encabezado */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="mt-3 text-3xl font-medium tracking-tight text-white sm:text-4xl">
              Registros
            </h1>
          </div>

          {empleadosFiltrados.length > 0 && (
            <button
              type="button"
              onClick={imprimirReporteGeneral}
              disabled={generandoReporte}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-600 px-4 py-3 text-sm font-medium text-white shadow-lg shadow-cyan-950/30 transition hover:bg-cyan-500 active:scale-[0.99] disabled:opacity-50 sm:w-auto"
            >
              <Printer size={18} />
              {generandoReporte ? 'Generando documento...' : 'Imprimir reporte'}
            </button>
          )}
        </div>

        {/* Panel de Filtros Liquid Glass */}
        <div className="rounded-3xl border border-white/10 bg-white/4 p-4 shadow-[0_20px_60px_rgba(0,0,0,0.18)] backdrop-blur-xl sm:p-5">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
            {/* Buscador por nombre */}
            <div className="relative md:col-span-5">
              <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                Buscar empleado
              </label>
              <div className="relative">
                <Search
                  size={17}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  value={busquedaNombre}
                  onChange={(e) => setBusquedaNombre(e.target.value)}
                  placeholder="Buscar por nombre..."
                  className="w-full rounded-xl border border-white/5 bg-black/20 py-2.5 pl-10 pr-9 text-sm text-white placeholder-slate-500 shadow-inner transition focus:border-cyan-400 focus:bg-white/10 focus:outline-none"
                />
                {busquedaNombre && (
                  <button
                    type="button"
                    onClick={() => setBusquedaNombre('')}
                    aria-label="Limpiar búsqueda"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 transition hover:bg-white/10 hover:text-white"
                  >
                    <X size={15} />
                  </button>
                )}
              </div>
            </div>

            {/* Filtro de sucursal */}
            <div className="md:col-span-3">
              <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                Sucursal
              </label>
              <div className="relative">
                <Building
                  size={17}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <select
                  value={sucursalFiltro}
                  onChange={(e) => setSucursalFiltro(e.target.value)}
                  className="w-full rounded-xl border border-white/5 bg-black/20 py-2.5 pl-10 pr-4 text-sm text-white shadow-inner transition focus:border-cyan-400 focus:bg-white/10 focus:outline-none"
                >
                  <option value="" className="bg-slate-900 text-white">
                    Todas las sucursales
                  </option>
                  {sucursales.map((sucursal) => (
                    <option
                      key={sucursal.id}
                      value={sucursal.id}
                      className="bg-slate-900 text-white"
                    >
                      {sucursal.nombre}
                    </option>
                  ))}
                  <option value="sin_asignar" className="bg-slate-900 text-white">
                    Sin sucursal asignada
                  </option>
                </select>
              </div>
            </div>

            {/* Fecha inicio */}
            <div className="md:col-span-2">
              <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                Desde
              </label>
              <input
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                className="w-full rounded-xl border border-white/5 bg-black/20 px-3 py-2.5 text-sm text-white shadow-inner transition focus:border-cyan-400 focus:bg-white/10 focus:outline-none"
              />
            </div>

            {/* Fecha fin */}
            <div className="md:col-span-2">
              <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                Hasta
              </label>
              <input
                type="date"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
                className="w-full rounded-xl border border-white/5 bg-black/20 px-3 py-2.5 text-sm text-white shadow-inner transition focus:border-cyan-400 focus:bg-white/10 focus:outline-none"
              />
            </div>
          </div>

          {/* Atajos de período */}
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-white/5 pt-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] uppercase tracking-wider text-slate-500">
                Período rápido:
              </span>
              <button
                type="button"
                onClick={() => aplicarRangoRapido('semana')}
                className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-slate-300 transition hover:border-cyan-400/30 hover:bg-cyan-500/10 hover:text-cyan-200"
              >
                Última semana
              </button>
              <button
                type="button"
                onClick={() => aplicarRangoRapido('quincena')}
                className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-slate-300 transition hover:border-cyan-400/30 hover:bg-cyan-500/10 hover:text-cyan-200"
              >
                Últimos 15 días
              </button>
              <button
                type="button"
                onClick={() => aplicarRangoRapido('mes')}
                className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-slate-300 transition hover:border-cyan-400/30 hover:bg-cyan-500/10 hover:text-cyan-200"
              >
                Mes actual
              </button>
            </div>

            <span className="text-xs text-slate-400">
              Mostrando <strong className="text-white">{empleadosFiltrados.length}</strong> de{' '}
              {listaEmpleados.length} empleados
            </span>
          </div>
        </div>

        {error && (
          <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {error}
          </div>
        )}

        {cargando ? (
          <div className="flex min-h-64 flex-col items-center justify-center rounded-3xl border border-white/10 bg-white/3 p-12 text-center backdrop-blur-xl">
            <Clock3 className="mb-3 h-10 w-10 animate-spin text-cyan-400" />
            <p className="text-sm tracking-wide text-slate-300">
              Cargando registros de asistencia...
            </p>
          </div>
        ) : empleadosFiltrados.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-white/10 bg-white/3 px-6 py-16 text-center">
            <Users className="mx-auto mb-4 text-slate-600" size={34} />
            <p className="font-medium text-slate-300">No se encontraron registros de empleados</p>
            <p className="mt-1 text-sm text-slate-500">
              Prueba ajustando el nombre, la sucursal o el rango de fechas.
            </p>
            {(busquedaNombre || sucursalFiltro) && (
              <button
                type="button"
                onClick={() => {
                  setBusquedaNombre('');
                  setSucursalFiltro('');
                }}
                className="mt-4 inline-flex items-center gap-2 rounded-xl border border-cyan-400/20 bg-cyan-500/10 px-4 py-2 text-xs font-medium text-cyan-200 transition hover:bg-cyan-500/20"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Vista Móvil (Tarjetas) */}
            <div className="grid gap-3 md:hidden">
              {empleadosFiltrados.map((item) => {
                const { empleado, estadisticas } = item;

                return (
                  <article
                    key={empleado.id}
                    className="rounded-2xl border border-white/10 bg-white/4 p-4 shadow-lg shadow-black/10 backdrop-blur-xl"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h2 className="truncate font-semibold text-white">
                          {empleado.nombre_completo}
                        </h2>
                        <p className="mt-0.5 text-xs text-slate-400">
                          {empleado.puesto_nombre || 'Sin puesto'} ·{' '}
                          {empleado.turno_hora_inicio || '--:--'} -{' '}
                          {empleado.turno_hora_fin || '--:--'}
                        </p>
                      </div>
                      <span className="shrink-0 rounded-full border border-cyan-400/20 bg-cyan-500/10 px-2.5 py-1 text-[11px] font-medium text-cyan-200">
                        {empleado.sucursal_nombre || 'Sin sucursal'}
                      </span>
                    </div>

                    <dl className="mt-4 grid grid-cols-3 gap-2 border-y border-white/5 py-3 text-center text-xs">
                      <div className="rounded-xl bg-black/20 py-2">
                        <dt className="text-[10px] uppercase tracking-wider text-slate-500">
                          Entradas
                        </dt>
                        <dd className="mt-0.5 font-semibold text-emerald-300">
                          {estadisticas?.total_entradas ?? 0}
                        </dd>
                      </div>
                      <div className="rounded-xl bg-black/20 py-2">
                        <dt className="text-[10px] uppercase tracking-wider text-slate-500">
                          Retardos
                        </dt>
                        <dd className="mt-0.5 font-semibold text-amber-300">
                          {estadisticas?.total_retardos ?? 0}
                        </dd>
                      </div>
                      <div className="rounded-xl bg-black/20 py-2">
                        <dt className="text-[10px] uppercase tracking-wider text-slate-500">
                          Faltas
                        </dt>
                        <dd className="mt-0.5 font-semibold text-rose-300">
                          {estadisticas?.total_faltas ?? 0}
                        </dd>
                      </div>
                    </dl>

                    <div className="mt-3 flex items-center justify-end gap-2">
                      <button
                        type="button"
                        className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 transition hover:bg-white/10 hover:text-white"
                        title="Imprimir reporte individual"
                      >
                        <Printer size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEmpleadoModal(item)}
                        className="inline-flex h-10 items-center gap-2 rounded-xl border border-cyan-400/20 bg-cyan-500/10 px-3 text-sm font-medium text-cyan-100 transition hover:bg-cyan-500/20"
                      >
                        <Eye size={16} />
                        <span>Ver</span>
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>

            {/* Vista Escritorio (Tabla) */}
            <div className="hidden overflow-hidden rounded-3xl border border-white/10 bg-white/4 shadow-[0_20px_60px_rgba(0,0,0,0.18)] backdrop-blur-xl md:block">
              <div className="overflow-x-auto">
                <table className="w-full min-w-225 border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/2">
                      <th className="px-5 py-4 text-left text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                        Empleado
                      </th>
                      <th className="px-4 py-4 text-left text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                        Sucursal
                      </th>
                      <th className="px-4 py-4 text-left text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                        Puesto / Horario
                      </th>
                      <th className="px-4 py-4 text-center text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                        Entradas
                      </th>
                      <th className="px-4 py-4 text-center text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                        Retardos
                      </th>
                      <th className="px-4 py-4 text-center text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                        Faltas
                      </th>
                      <th className="px-5 py-4 text-center text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {empleadosFiltrados.map((item) => {
                      const { empleado, estadisticas } = item;

                      return (
                        <tr
                          key={empleado.id}
                          className="border-b border-white/5 transition hover:bg-cyan-500/5"
                        >
                          <td className="px-5 py-4 font-medium text-white">
                            {empleado.nombre_completo}
                          </td>
                          <td className="px-4 py-4 text-sm text-slate-300">
                            <span className="inline-block rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-1 text-xs font-medium text-cyan-200">
                              {empleado.sucursal_nombre || 'Sin sucursal'}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-sm text-slate-400">
                            <div className="text-slate-300">
                              {empleado.puesto_nombre || 'Sin puesto'}
                            </div>
                            <div className="font-mono text-xs text-slate-500">
                              {empleado.turno_hora_inicio || '--:--'} -{' '}
                              {empleado.turno_hora_fin || '--:--'}
                            </div>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <span className="inline-flex min-w-8 items-center justify-center rounded-full border border-emerald-400/20 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-300">
                              {estadisticas?.total_entradas ?? 0}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <span
                              className={`inline-flex min-w-8 items-center justify-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                                (estadisticas?.total_retardos ?? 0) > 0
                                  ? 'border-amber-400/20 bg-amber-500/10 text-amber-300'
                                  : 'border-white/10 bg-white/5 text-slate-400'
                              }`}
                            >
                              {estadisticas?.total_retardos ?? 0}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <span
                              className={`inline-flex min-w-8 items-center justify-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                                (estadisticas?.total_faltas ?? 0) > 0
                                  ? 'border-rose-400/20 bg-rose-500/10 text-rose-300'
                                  : 'border-white/10 bg-white/5 text-slate-400'
                              }`}
                            >
                              {estadisticas?.total_faltas ?? 0}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                type="button"
                                onClick={() => setEmpleadoModal(item)}
                                title="Ver registros"
                                className="inline-flex items-center gap-1.5 rounded-xl border border-cyan-400/20 bg-cyan-500/10 px-3 py-2 text-xs font-medium text-cyan-300 transition hover:bg-cyan-500/20"
                              >
                                <Eye size={15} />
                                <span>Ver</span>
                              </button>
                              <button
                                type="button"
                                title="Imprimir reporte individual"
                                className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 p-2 text-slate-300 transition hover:bg-white/10 hover:text-white"
                              >
                                <Printer size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modal Liquid Glass con el detalle de registros del empleado */}
      {empleadoModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-3 backdrop-blur-md sm:p-4"
          onClick={() => setEmpleadoModal(null)}
        >
          <div
            className="flex max-h-[calc(100dvh-1.5rem)] w-full max-w-2xl flex-col overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/2 shadow-[0_24px_80px_rgba(0,0,0,0.5)] backdrop-blur-3xl sm:max-h-[calc(100dvh-2rem)]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header del modal */}
            <div className="flex items-start justify-between gap-3 border-b border-white/10 px-5 pb-4 pt-5 sm:px-7 sm:pb-5 sm:pt-6">
              <div className="min-w-0">
                <p className="mb-0.5 text-[11px] font-medium uppercase tracking-widest text-gray-500">
                  {empleadoModal.empleado.sucursal_nombre || 'Sin sucursal'} ·{' '}
                  {formatearFecha(fechaInicio)} → {formatearFecha(fechaFin)}
                </p>
                <h2 className="m-0 truncate text-lg font-light tracking-wide text-gray-100 sm:text-xl">
                  {empleadoModal.empleado.nombre_completo}
                </h2>
                <p className="mt-1 text-xs text-slate-400">
                  {empleadoModal.empleado.puesto_nombre || 'Sin puesto'} · Horario:{' '}
                  <span className="font-mono text-slate-300">
                    {empleadoModal.empleado.turno_hora_inicio || '--:--'} -{' '}
                    {empleadoModal.empleado.turno_hora_fin || '--:--'}
                  </span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEmpleadoModal(null)}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-gray-400 transition hover:bg-white/10 hover:text-gray-200"
              >
                <X size={16} />
              </button>
            </div>

            {/* Cuerpo del modal */}
            <div className="flex flex-col gap-4 overflow-y-auto px-5 py-5 sm:px-7">
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                <StatCard
                  label="Entradas"
                  value={empleadoModal.estadisticas?.total_entradas}
                  color="text-emerald-300"
                />
                <StatCard
                  label="Salidas"
                  value={empleadoModal.estadisticas?.total_salidas}
                  color="text-cyan-300"
                />
                <StatCard
                  label="Retardos"
                  value={empleadoModal.estadisticas?.total_retardos}
                  color="text-amber-300"
                />
                <StatCard
                  label="Faltas"
                  value={empleadoModal.estadisticas?.total_faltas}
                  color="text-rose-300"
                />
              </div>

              <div className="space-y-2">
                {empleadoModal.dias?.map((dia) => (
                  <DiaRow key={dia.fecha} dia={dia} />
                ))}
              </div>
            </div>

            {/* Footer del modal */}
            <div className="flex gap-3 border-t border-white/10 px-5 pb-5 pt-4 sm:px-7 sm:pb-6">
              <button
                type="button"
                onClick={() => setEmpleadoModal(null)}
                className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 text-sm font-medium text-gray-300 transition hover:bg-white/10"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Award,
  Building,
  Calendar,
  CalendarDays,
  CheckCircle2,
  Clock3,
  DollarSign,
  Eye,
  FileText,
  Gift,
  MinusCircle,
  Plane,
  Printer,
  RefreshCw,
  Search,
  SlidersHorizontal,
  UserCheck,
  Users,
  X,
} from 'lucide-react';
import api from '../../services/api';
import { useAlert } from '../../context/AlertContext';

const LOGO_URL = 'https://i.postimg.cc/wvfqWVVS/LGO-SVG.png';

const STORAGE_BONO_KEY = 'unifam_nomina_bono_config_v1';

const CONDICIONES = {
  puntual: {
    label: 'Puntual',
    icon: UserCheck,
    color: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/20',
  },
  retardo: {
    label: 'Retardo',
    icon: AlertTriangle,
    color: 'text-amber-300 bg-amber-500/10 border-amber-500/20',
  },
  falta: {
    label: 'Falta',
    icon: MinusCircle,
    color: 'text-rose-300 bg-rose-500/10 border-rose-500/20',
  },
  descanso: {
    label: 'Descanso',
    icon: Calendar,
    color: 'text-blue-300 bg-blue-500/10 border-blue-500/20',
  },
  festivo: {
    label: 'Día festivo',
    icon: CalendarDays,
    color: 'text-violet-300 bg-violet-500/10 border-violet-500/20',
  },
  permiso: {
    label: 'Permiso',
    icon: FileText,
    color: 'text-orange-300 bg-orange-500/10 border-orange-500/20',
  },
  vacaciones: {
    label: 'Vacaciones',
    icon: Plane,
    color: 'text-cyan-300 bg-cyan-500/10 border-cyan-500/20',
  },
  cumpleanos: {
    label: 'Cumpleaños',
    icon: Gift,
    color: 'text-pink-300 bg-pink-500/10 border-pink-500/20',
  },
  previo_ingreso: {
    label: 'Previo a ingreso',
    icon: null,
    color: 'text-slate-400 bg-white/5 border-white/10',
  },
  futuro: {
    label: 'Futuro',
    icon: null,
    color: 'text-slate-400 bg-white/5 border-white/10',
  },
};

const round2 = (num) => Math.round((Number(num) + Number.EPSILON) * 100) / 100;

const toLocalISODate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getToday = () => toLocalISODate(new Date());

const getMonthStart = () => {
  const now = new Date();
  return toLocalISODate(new Date(now.getFullYear(), now.getMonth(), 1));
};

const formatearFecha = (fecha) => {
  if (!fecha) return '--/--/----';
  return new Date(`${String(fecha).slice(0, 10)}T12:00:00`).toLocaleDateString('es-MX', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

const formatCurrency = (value) =>
  new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);

const escapeHtml = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const formatearHoraAmPm = (hora) => {
  if (!hora) return '';
  const match = String(hora).trim().match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (!match) return String(hora);
  const horas24 = Number(match[1]);
  const minutos = match[2];
  if (Number.isNaN(horas24)) return String(hora);
  const sufijo = horas24 >= 12 ? 'p.m.' : 'a.m.';
  const horas12 = horas24 % 12 || 12;
  return `${String(horas12).padStart(2, '0')}:${minutos} ${sufijo}`;
};

const formatearHorarioTurno = (horaInicio, horaFin) => {
  if (!horaInicio && !horaFin) return 'Sin turno asignado';
  const inicio = formatearHoraAmPm(horaInicio) || '--:--';
  const fin = formatearHoraAmPm(horaFin) || '--:--';
  return `${inicio} – ${fin}`;
};

const esDiaLaboralParaBono = (dia) => {
  const tipos = (dia?.condiciones || []).map((c) => c.tipo);
  if (tipos.length === 0) return false;
  if (tipos.some((t) => ['previo_ingreso', 'futuro', 'descanso', 'festivo'].includes(t))) {
    return false;
  }
  if (tipos.every((t) => t === 'cumpleanos')) {
    return false;
  }
  return true;
};

const evaluarBonoEstrictoEmpleado = (emp) => {
  if (emp?.aplica_bono === false) {
    return {
      valido: false,
      motivo: 'Inválido · No participa en bono (turno o colaborador con bono inactivo)',
    };
  }

  const dias = emp?.dias || [];
  let diasEvaluables = 0;
  let diasFalladosBono = 0;

  for (const dia of dias) {
    const tipos = (dia?.condiciones || []).map((c) => c.tipo);
    if (tipos.some((t) => ['previo_ingreso', 'futuro'].includes(t))) continue;

    if (tipos.some((t) => ['retardo', 'falta', 'permiso', 'vacaciones'].includes(t))) {
      diasEvaluables++;
      diasFalladosBono++;
      continue;
    }

    if (tipos.some((t) => ['descanso', 'festivo'].includes(t))) continue;
    if (tipos.every((t) => t === 'cumpleanos')) continue;

    diasEvaluables++;
    if (!dia.tiene_bono) {
      diasFalladosBono++;
    }
  }

  if (diasEvaluables === 0) {
    return {
      valido: false,
      motivo: 'Inválido · Sin días laborados evaluables en el período',
    };
  }

  if (diasFalladosBono > 0 || (emp?.faltas || 0) > 0 || (emp?.retardos || 0) > 0) {
    const motivos = [];
    if ((emp?.faltas || 0) > 0) motivos.push(`${emp.faltas} falta(s)`);
    if ((emp?.retardos || 0) > 0) motivos.push(`${emp.retardos} retardo(s)`);
    if ((emp?.dias_vacaciones || 0) + (emp?.dias_permiso || 0) > 0) {
      motivos.push(`${(emp?.dias_vacaciones || 0) + (emp?.dias_permiso || 0)} permiso/vacación`);
    }
    const llegadasFueraMargen = Math.max(
      0,
      (emp?.dias_trabajados || 0) - (emp?.bonos_diarios || 0) - (emp?.retardos || 0)
    );
    if (llegadasFueraMargen > 0) {
      motivos.push(`${llegadasFueraMargen} llegada(s) fuera del margen de bono`);
    }
    if (motivos.length === 0) {
      motivos.push(`${diasFalladosBono} día(s) sin cumplir horario de bono`);
    }
    return {
      valido: false,
      motivo: `Inválido · ${motivos.join(', ')}`,
    };
  }

  return {
    valido: true,
    motivo: 'Válido · Cumplió horario de bono en todos sus días laborables del período',
  };
};

function generarDocumentoNominaGeneral({
  empleados,
  periodo,
  sucursalNombre,
  busquedaNombre,
  bonoModo,
  bonoValor,
}) {
  const gruposMap = new Map();
  let totalBaseGlobal = 0;
  let totalDescuentoGlobal = 0;
  let totalBonoGlobal = 0;
  let totalAjusteGlobal = 0;
  let totalNetoGlobal = 0;
  let totalFaltasGlobal = 0;
  let totalAcreedoresBono = 0;

  empleados.forEach((emp) => {
    const key = emp.sucursal_id || 'sin-sucursal';
    if (!gruposMap.has(key)) {
      gruposMap.set(key, {
        nombre: emp.sucursal_nombre || 'Sin sucursal asignada',
        empleados: [],
        subtotalBase: 0,
        subtotalDescuento: 0,
        subtotalBono: 0,
        subtotalNeto: 0,
      });
    }
    const grupo = gruposMap.get(key);
    grupo.empleados.push(emp);
    grupo.subtotalBase = round2(grupo.subtotalBase + emp.salario_base);
    grupo.subtotalDescuento = round2(grupo.subtotalDescuento + emp.descuento);
    grupo.subtotalBono = round2(grupo.subtotalBono + emp.monto_bono + (emp.ajuste_manual || 0));
    grupo.subtotalNeto = round2(grupo.subtotalNeto + emp.salario_neto);

    totalBaseGlobal = round2(totalBaseGlobal + emp.salario_base);
    totalDescuentoGlobal = round2(totalDescuentoGlobal + emp.descuento);
    totalBonoGlobal = round2(totalBonoGlobal + emp.monto_bono);
    totalAjusteGlobal = round2(totalAjusteGlobal + (emp.ajuste_manual || 0));
    totalNetoGlobal = round2(totalNetoGlobal + emp.salario_neto);
    totalFaltasGlobal += Number(emp.faltas || 0);
    if (emp.acreedor_bono_efectivo && emp.monto_bono > 0) {
      totalAcreedoresBono++;
    }
  });

  const grupos = [...gruposMap.values()];
  const fechaEmision = new Date().toLocaleString('es-MX', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  const descripcionBono =
    bonoModo === 'porcentaje'
      ? `${Number(bonoValor) || 0}% sobre sueldo del período`
      : bonoModo === 'fijo'
        ? `${formatCurrency(bonoValor)} fijos por período`
        : 'Sin bono económico activo';

  const seccionesHtml = grupos
    .map((grupo) => {
      const filas = grupo.empleados
        .map((emp, idx) => {
          return `
            <tr>
              <td class="col-num">${idx + 1}</td>
              <td class="col-emp">
                <div class="emp-name">${escapeHtml(emp.nombre_completo)}</div>
                <div class="emp-role">${escapeHtml(emp.puesto || 'Sin puesto')}</div>
              </td>
              <td class="col-money">${escapeHtml(formatCurrency(emp.salario_diario))}</td>
              <td class="col-metric">
                <span class="metric-pill pill-sage">${emp.dias_trabajados}</span>
              </td>
              <td class="col-metric">
                <span class="metric-pill pill-neutral">${emp.dias_justificados}</span>
              </td>
              <td class="col-metric">
                <span class="metric-pill ${emp.retardos > 0 ? 'pill-amber' : 'pill-neutral'}">${emp.retardos}</span>
              </td>
              <td class="col-metric">
                <span class="metric-pill ${emp.faltas > 0 ? 'pill-rose' : 'pill-neutral'}">${emp.faltas}</span>
              </td>
              <td class="col-money">${escapeHtml(formatCurrency(emp.salario_base))}</td>
              <td class="col-money ${emp.descuento > 0 ? 'txt-rose' : 'txt-muted'}">
                ${emp.descuento > 0 ? `- ${escapeHtml(formatCurrency(emp.descuento))}` : formatCurrency(0)}
              </td>
              <td class="col-money ${emp.monto_bono > 0 ? 'txt-blue' : 'txt-muted'}">
                <div>${emp.monto_bono > 0 ? `+ ${escapeHtml(formatCurrency(emp.monto_bono))}` : formatCurrency(0)}</div>
                <span class="metric-pill ${emp.acreedor_bono_efectivo ? 'pill-sage' : 'pill-rose'}" style="margin-top:2px;font-size:7.5px;padding:1px 4px;">
                  ${emp.acreedor_bono_efectivo ? 'Válido' : 'Inválido'}
                </span>
              </td>
              <td class="col-money col-neto">${escapeHtml(formatCurrency(emp.salario_neto))}</td>
              <td class="col-firma"></td>
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
            } · Subtotal Neto: ${escapeHtml(formatCurrency(grupo.subtotalNeto))}</span>
          </div>

          <table class="summary-table">
            <thead>
              <tr>
                <th class="col-num">#</th>
                <th class="col-emp">Colaborador / Puesto</th>
                <th class="col-money">Sueldo Diario</th>
                <th class="col-metric">Trab.</th>
                <th class="col-metric">Desc./Just.</th>
                <th class="col-metric">Ret.</th>
                <th class="col-metric">Faltas</th>
                <th class="col-money">Sueldo Período</th>
                <th class="col-money">Desc. Faltas</th>
                <th class="col-money">Bono Punt.</th>
                <th class="col-money">Neto a Pagar</th>
                <th class="col-firma">Firma de Recibido</th>
              </tr>
            </thead>
            <tbody>
              ${filas}
            </tbody>
            <tfoot>
              <tr class="subtotal-row">
                <td colspan="7" class="subtotal-label">Subtotal ${escapeHtml(grupo.nombre)}:</td>
                <td class="col-money">${escapeHtml(formatCurrency(grupo.subtotalBase))}</td>
                <td class="col-money txt-rose">${
                  grupo.subtotalDescuento > 0
                    ? `- ${escapeHtml(formatCurrency(grupo.subtotalDescuento))}`
                    : formatCurrency(0)
                }</td>
                <td class="col-money txt-blue">${
                  grupo.subtotalBono > 0
                    ? `+ ${escapeHtml(formatCurrency(grupo.subtotalBono))}`
                    : formatCurrency(0)
                }</td>
                <td class="col-money col-neto">${escapeHtml(formatCurrency(grupo.subtotalNeto))}</td>
                <td></td>
              </tr>
            </tfoot>
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
      font-size: 10.5px;
      line-height: 1.38;
    }
    .doc-container {
      width: 100%;
      max-width: 100%;
    }
    .doc-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 14px;
      background: #f4f7fa;
      color: #2c3e50;
      padding: 11px 15px;
      border-radius: 10px;
      border: 1px solid #dce4ec;
      border-bottom: 2px solid #8fa4b8;
      margin-bottom: 10px;
    }
    .brand-block {
      display: flex;
      align-items: center;
      gap: 14px;
    }
    .brand-logo {
      height: 40px;
      width: auto;
      object-fit: contain;
      display: block;
    }
    .brand-divider {
      width: 1px;
      height: 32px;
      background: #cfd9e3;
    }
    .doc-title-block h1 {
      margin: 0;
      font-size: 15px;
      font-weight: 700;
      letter-spacing: 0.03em;
      text-transform: uppercase;
      color: #2b3d4f;
    }
    .doc-title-block p {
      margin: 2px 0 0;
      font-size: 10px;
      color: #64748b;
    }
    .doc-meta {
      text-align: right;
      font-size: 9.5px;
      color: #526375;
      line-height: 1.42;
      white-space: nowrap;
      flex-shrink: 0;
    }
    .doc-meta strong {
      color: #3b536b;
      font-weight: 600;
    }

    .summary-bar {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
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
    .summary-item.highlight {
      background: #eff6f2;
      border-color: #cde2d6;
    }
    .summary-item .num {
      display: block;
      font-size: 13.5px;
      font-weight: 700;
      color: #334155;
      font-variant-numeric: tabular-nums;
    }
    .summary-item .lbl {
      display: block;
      margin-top: 1px;
      font-size: 8px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: #64748b;
    }
    .num-sage { color: #35634f !important; }
    .num-blue { color: #426280 !important; }
    .num-rose { color: #8c4650 !important; }

    .branch-section {
      margin-bottom: 12px;
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
      font-size: 8px;
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
      font-size: 11.5px;
      font-weight: 700;
      color: #2b3d4f;
    }
    .branch-count {
      font-size: 9.5px;
      font-weight: 600;
      color: #475569;
    }

    .summary-table {
      width: 100%;
      border-collapse: collapse;
      border: 1px solid #dce4ec;
      border-top: none;
      font-size: 9.5px;
      background: #ffffff;
    }
    .summary-table th {
      background: #f6f8fb;
      color: #475569;
      font-weight: 700;
      text-transform: uppercase;
      font-size: 8px;
      letter-spacing: 0.04em;
      padding: 6px 7px;
      border-bottom: 1px solid #dce4ec;
      text-align: left;
      white-space: nowrap;
    }
    .summary-table td {
      padding: 6px 7px;
      border-bottom: 1px solid #edf2f7;
      color: #334155;
      vertical-align: middle;
    }
    .summary-table tbody tr:nth-child(even) td {
      background: #fafcfe;
    }
    .subtotal-row td {
      background: #f4f7fa !important;
      border-top: 1px solid #cfd9e3;
      font-weight: 700;
      padding: 6px 7px;
    }
    .subtotal-label {
      text-align: right;
      color: #475569;
      text-transform: uppercase;
      font-size: 8.5px;
      letter-spacing: 0.05em;
    }
    .col-num {
      width: 24px;
      text-align: center !important;
      color: #94a3b8 !important;
      font-weight: 600;
    }
    .col-emp {
      width: 22%;
    }
    .emp-name {
      font-weight: 600;
      color: #1e293b;
      font-size: 10px;
    }
    .emp-role {
      font-size: 8.5px;
      color: #64748b;
    }
    .col-metric {
      width: 42px;
      text-align: center !important;
      white-space: nowrap;
    }
    .col-money {
      text-align: right !important;
      white-space: nowrap;
      font-variant-numeric: tabular-nums;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 9.5px;
    }
    .col-neto {
      font-weight: 700;
      color: #2c5242 !important;
      background: #f5faf7 !important;
    }
    .col-firma {
      width: 105px;
      border-left: 1px dashed #cbd5e1;
    }
    .txt-rose { color: #8a434d !important; font-weight: 600; }
    .txt-blue { color: #3b5975 !important; font-weight: 600; }
    .txt-muted { color: #94a3b8 !important; }

    .metric-pill {
      display: inline-block;
      min-width: 22px;
      padding: 1.5px 5px;
      border-radius: 4px;
      font-size: 9px;
      font-weight: 600;
      text-align: center;
      font-variant-numeric: tabular-nums;
    }
    .pill-neutral { background: #f3f6f9; color: #526375; border: 1px solid #e2e8f0; }
    .pill-sage { background: #eff6f2; color: #386652; border: 1px solid #d5e6dd; }
    .pill-amber { background: #fbf6ee; color: #855d33; border: 1px solid #ebd9be; }
    .pill-rose { background: #faeff0; color: #8a434d; border: 1px solid #ebcfd3; }

    .grand-total-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #eef5f1;
      border: 1px solid #c5ddd0;
      border-left: 4px solid #487860;
      border-radius: 8px;
      padding: 9px 14px;
      margin-top: 8px;
      page-break-inside: avoid;
    }
    .grand-total-bar .gt-label {
      font-size: 10.5px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #2d4f3e;
    }
    .grand-total-bar .gt-sub {
      font-size: 9px;
      color: #527060;
      margin-top: 1px;
    }
    .grand-total-bar .gt-amount {
      font-size: 15px;
      font-weight: 800;
      color: #234735;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    }

    .doc-footer {
      margin-top: 22px;
      padding-top: 12px;
      border-top: 1px solid #dce4ec;
      display: flex;
      justify-content: space-around;
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
      height: 24px;
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
          <h1>Reporte Ejecutivo de Nómina</h1>
          <p>Concentrado de percepciones, descuentos por faltas y bono de puntualidad</p>
        </div>
      </div>
      <div class="doc-meta">
        <div><strong>Período:</strong> ${escapeHtml(formatearFecha(periodo?.inicio))} al ${escapeHtml(
          formatearFecha(periodo?.fin)
        )} (${escapeHtml(periodo?.dias_base_pago || 15)} días base)</div>
        <div><strong>Sucursal:</strong> ${escapeHtml(sucursalNombre)}</div>
        <div><strong>Regla Bono:</strong> ${escapeHtml(descripcionBono)}</div>
        ${busquedaNombre ? `<div><strong>Filtro:</strong> "${escapeHtml(busquedaNombre)}"</div>` : ''}
        <div><strong>Emisión:</strong> ${escapeHtml(fechaEmision)}</div>
      </div>
    </header>

    <section class="summary-bar">
      <div class="summary-item">
        <span class="num">${empleados.length}</span>
        <span class="lbl">Colaboradores</span>
      </div>
      <div class="summary-item">
        <span class="num">${escapeHtml(formatCurrency(totalBaseGlobal))}</span>
        <span class="lbl">Sueldo Base Período</span>
      </div>
      <div class="summary-item">
        <span class="num num-rose">- ${escapeHtml(formatCurrency(totalDescuentoGlobal))}</span>
        <span class="lbl">Descuentos (${totalFaltasGlobal} ${totalFaltasGlobal === 1 ? 'falta' : 'faltas'})</span>
      </div>
      <div class="summary-item">
        <span class="num num-blue">+ ${escapeHtml(formatCurrency(totalBonoGlobal + totalAjusteGlobal))}</span>
        <span class="lbl">Bonos (${totalAcreedoresBono} ${totalAcreedoresBono === 1 ? 'acreedor' : 'acreedores'})</span>
      </div>
      <div class="summary-item highlight">
        <span class="num num-sage">${escapeHtml(formatCurrency(totalNetoGlobal))}</span>
        <span class="lbl">Neto Total a Dispersar</span>
      </div>
    </section>

    ${seccionesHtml}

    <div class="grand-total-bar">
      <div>
        <div class="gt-label">Total Neto General de Nómina a Dispersar</div>
        <div class="gt-sub">Base: Sueldo Quincenal ÷ 15 días · Descansos, festivos y vacaciones aprobadas pagados al 100%</div>
      </div>
      <div class="gt-amount">${escapeHtml(formatCurrency(totalNetoGlobal))}</div>
    </div>

    <footer class="doc-footer">
      <div class="signature-box">
        <div class="signature-line"></div>
        <strong>Elaboró Recursos Humanos</strong>
      </div>
      <div class="signature-box">
        <div class="signature-line"></div>
        <strong>Autorizó Dirección / Administración</strong>
      </div>
    </footer>
  </div>
</body>
</html>`;
}

function generarReciboNominaIndividual({ emp, periodo, bonoModo, bonoValor }) {
  const fechaEmision = new Date().toLocaleString('es-MX', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  const horario = formatearHorarioTurno(emp.turno_hora_inicio, emp.turno_hora_fin);

  const etiquetaBono =
    bonoModo === 'porcentaje'
      ? `Bono de Puntualidad (${Number(bonoValor) || 0}%)`
      : 'Bono de Puntualidad';

  const getPillClassByTipo = (tipo) => {
    switch (tipo) {
      case 'puntual':
        return 'pill-sage';
      case 'retardo':
      case 'permiso':
        return 'pill-amber';
      case 'falta':
        return 'pill-rose';
      case 'descanso':
      case 'vacaciones':
      case 'festivo':
      case 'cumpleanos':
        return 'pill-blue';
      default:
        return 'pill-neutral';
    }
  };

  const filasDias = (emp.dias || [])
    .map((dia, idx) => {
      const condiciones =
        dia.condiciones && dia.condiciones.length > 0
          ? dia.condiciones
          : [{ tipo: 'futuro', label: 'Sin registro' }];

      const badgesHtml = condiciones
        .map(
          (c) =>
            `<span class="status-badge ${getPillClassByTipo(c.tipo)}">${escapeHtml(
              c.label || c.tipo
            )}</span>`
        )
        .join(' ');

      const esFalta = condiciones.some((c) => c.tipo === 'falta');
      const evaluableBono = esDiaLaboralParaBono(dia);
      const bonoDiaValido = Boolean(
        evaluableBono &&
          emp.aplica_bono !== false &&
          dia.tiene_bono &&
          !condiciones.some((c) => ['retardo', 'falta', 'permiso', 'vacaciones'].includes(c.tipo))
      );

      return `
        <tr>
          <td class="col-num">${idx + 1}</td>
          <td class="col-fecha">${escapeHtml(formatearFecha(dia.fecha))}</td>
          <td class="col-dia">${escapeHtml(dia.dia_semana || '')}</td>
          <td>${badgesHtml}</td>
          <td class="col-hora">${escapeHtml(formatearHoraAmPm(dia.hora_entrada) || '--:--')}</td>
          <td class="col-hora">${escapeHtml(formatearHoraAmPm(dia.hora_salida) || '--:--')}</td>
          <td class="col-bono">
            ${
              evaluableBono
                ? `<span class="status-badge ${bonoDiaValido ? 'pill-sage' : 'pill-rose'}">${
                    bonoDiaValido ? 'Válido' : 'Inválido'
                  }</span>`
                : '<span class="txt-muted">—</span>'
            }
          </td>
          <td class="col-money ${esFalta ? 'txt-rose' : 'txt-muted'}">
            ${esFalta ? `- ${escapeHtml(formatCurrency(emp.salario_diario))}` : '—'}
          </td>
        </tr>
      `;
    })
    .join('');

  const totalPercepciones = round2(
    emp.salario_base + emp.monto_bono + (emp.ajuste_manual > 0 ? emp.ajuste_manual : 0)
  );
  const totalDeducciones = round2(
    emp.descuento + (emp.ajuste_manual < 0 ? Math.abs(emp.ajuste_manual) : 0)
  );

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>&nbsp;</title>
  <style>
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
      font-size: 10.5px;
      line-height: 1.38;
    }
    .doc-container {
      width: 100%;
      max-width: 100%;
    }
    .doc-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 14px;
      background: #f4f7fa;
      color: #2c3e50;
      padding: 11px 15px;
      border-radius: 10px;
      border: 1px solid #dce4ec;
      border-bottom: 2px solid #8fa4b8;
      margin-bottom: 10px;
    }
    .brand-block {
      display: flex;
      align-items: center;
      gap: 14px;
    }
    .brand-logo {
      height: 40px;
      width: auto;
      object-fit: contain;
      display: block;
    }
    .brand-divider {
      width: 1px;
      height: 32px;
      background: #cfd9e3;
    }
    .doc-title-block h1 {
      margin: 0;
      font-size: 15px;
      font-weight: 700;
      letter-spacing: 0.03em;
      text-transform: uppercase;
      color: #2b3d4f;
    }
    .doc-title-block p {
      margin: 2px 0 0;
      font-size: 10px;
      color: #64748b;
    }
    .doc-meta {
      text-align: right;
      font-size: 9.5px;
      color: #526375;
      line-height: 1.42;
      white-space: nowrap;
      flex-shrink: 0;
    }
    .doc-meta strong {
      color: #3b536b;
      font-weight: 600;
    }

    .emp-profile-card {
      display: grid;
      grid-template-columns: 1.8fr 1.1fr 1fr 1fr 1fr 1fr;
      gap: 8px;
      background: #f8fafc;
      border: 1px solid #dce4ec;
      border-left: 3px solid #758da3;
      border-radius: 8px;
      padding: 8px 12px;
      margin-bottom: 10px;
    }
    .profile-field .field-label {
      display: block;
      font-size: 8px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: #64748b;
    }
    .profile-field .field-value {
      display: block;
      margin-top: 2px;
      font-size: 10.5px;
      font-weight: 600;
      color: #1e293b;
    }
    .profile-field .field-mono {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 10px;
    }

    .pay-breakdown-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin-bottom: 10px;
    }
    .pay-card {
      border: 1px solid #dce4ec;
      border-radius: 8px;
      background: #ffffff;
      overflow: hidden;
    }
    .pay-card-header {
      background: #eef3f7;
      padding: 6px 12px;
      font-size: 9px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: #334155;
      border-bottom: 1px solid #dce4ec;
    }
    .pay-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 6px 12px;
      border-bottom: 1px solid #f1f5f9;
      font-size: 10px;
    }
    .pay-row:last-child {
      border-bottom: none;
    }
    .pay-row.total-row {
      background: #f8fafc;
      font-weight: 700;
      border-top: 1px solid #dce4ec;
    }
    .pay-amount {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-weight: 600;
    }

    .neto-banner {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #eff6f2;
      border: 1px solid #c5ddd0;
      border-left: 4px solid #487860;
      border-radius: 8px;
      padding: 8px 14px;
      margin-bottom: 10px;
    }
    .neto-banner .nb-title {
      font-size: 10.5px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #2d4f3e;
    }
    .neto-banner .nb-sub {
      font-size: 9px;
      color: #527060;
      margin-top: 1px;
    }
    .neto-banner .nb-val {
      font-size: 15.5px;
      font-weight: 800;
      color: #234735;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    }

    .branch-section {
      margin-bottom: 12px;
    }
    .branch-banner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: #eef3f7;
      border: 1px solid #dce4ec;
      border-left: 3px solid #758da3;
      padding: 5px 12px;
      border-radius: 6px 6px 0 0;
    }
    .branch-banner h2 {
      margin: 0;
      font-size: 10.5px;
      font-weight: 700;
      color: #2b3d4f;
    }
    .branch-count {
      font-size: 9px;
      font-weight: 600;
      color: #5c7085;
    }
    .summary-table {
      width: 100%;
      border-collapse: collapse;
      border: 1px solid #dce4ec;
      border-top: none;
      font-size: 9.5px;
      background: #ffffff;
    }
    .summary-table th {
      background: #f6f8fb;
      color: #475569;
      font-weight: 700;
      text-transform: uppercase;
      font-size: 8px;
      letter-spacing: 0.04em;
      padding: 5px 8px;
      border-bottom: 1px solid #dce4ec;
      text-align: left;
    }
    .summary-table td {
      padding: 4.5px 8px;
      border-bottom: 1px solid #edf2f7;
      color: #334155;
      vertical-align: middle;
    }
    .summary-table tbody tr:nth-child(even) td {
      background: #fafcfe;
    }
    .col-num { width: 26px; text-align: center !important; color: #94a3b8; }
    .col-fecha { width: 82px; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-weight: 600; }
    .col-dia { width: 80px; text-transform: capitalize; color: #475569; }
    .col-hora { width: 82px; text-align: center !important; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; white-space: nowrap; }
    .col-bono { width: 72px; text-align: center !important; white-space: nowrap; }
    .col-money { width: 88px; text-align: right !important; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }
    .txt-rose { color: #8a434d !important; font-weight: 600; }
    .txt-blue { color: #3b5975 !important; font-weight: 600; }
    .txt-muted { color: #94a3b8 !important; }

    .status-badge {
      display: inline-block;
      padding: 1.5px 6px;
      border-radius: 4px;
      font-size: 8.5px;
      font-weight: 600;
      margin-right: 4px;
    }
    .pill-neutral { background: #f3f6f9; color: #526375; border: 1px solid #e2e8f0; }
    .pill-sage { background: #eff6f2; color: #386652; border: 1px solid #d5e6dd; }
    .pill-blue { background: #eff4f9; color: #426280; border: 1px solid #d6e2ee; }
    .pill-amber { background: #fbf6ee; color: #855d33; border: 1px solid #ebd9be; }
    .pill-rose { background: #faeff0; color: #8a434d; border: 1px solid #ebcfd3; }

    .doc-footer {
      margin-top: 18px;
      padding-top: 10px;
      border-top: 1px solid #dce4ec;
      display: flex;
      justify-content: space-around;
      align-items: flex-end;
      page-break-inside: avoid;
      font-size: 9px;
      color: #64748b;
    }
    .signature-box {
      text-align: center;
      width: 210px;
    }
    .signature-line {
      border-bottom: 1px solid #64748b;
      height: 24px;
      margin-bottom: 4px;
    }
    .signature-sub {
      display: block;
      margin-top: 2px;
      font-size: 8px;
      color: #94a3b8;
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
          <h1>Recibo Individual de Nómina</h1>
          <p>Comprobante de percepciones, asistencias y deducciones del período</p>
        </div>
      </div>
      <div class="doc-meta">
        <div><strong>Período:</strong> ${escapeHtml(formatearFecha(periodo?.inicio))} al ${escapeHtml(
          formatearFecha(periodo?.fin)
        )}</div>
        <div><strong>Base de cálculo:</strong> ${escapeHtml(periodo?.dias_base_pago || 15)} días</div>
        <div><strong>Emisión:</strong> ${escapeHtml(fechaEmision)}</div>
      </div>
    </header>

    <section class="emp-profile-card">
      <div class="profile-field">
        <span class="field-label">Colaborador</span>
        <span class="field-value">${escapeHtml(emp.nombre_completo)}</span>
      </div>
      <div class="profile-field">
        <span class="field-label">Puesto</span>
        <span class="field-value">${escapeHtml(emp.puesto || 'Sin puesto')}</span>
      </div>
      <div class="profile-field">
        <span class="field-label">Sucursal</span>
        <span class="field-value">${escapeHtml(emp.sucursal_nombre || 'Sin sucursal')}</span>
      </div>
      <div class="profile-field">
        <span class="field-label">Horario</span>
        <span class="field-value field-mono">${escapeHtml(horario)}</span>
      </div>
      <div class="profile-field">
        <span class="field-label">Sueldo Quincenal</span>
        <span class="field-value field-mono">${escapeHtml(formatCurrency(emp.salario_quincenal))}</span>
      </div>
      <div class="profile-field">
        <span class="field-label">Sueldo Diario (÷15)</span>
        <span class="field-value field-mono">${escapeHtml(formatCurrency(emp.salario_diario))}</span>
      </div>
    </section>

    <section class="pay-breakdown-grid">
      <div class="pay-card">
        <div class="pay-card-header">Percepciones</div>
        <div class="pay-row">
          <span>Sueldo base del período (${escapeHtml(emp.dias_base_pago)} días)</span>
          <span class="pay-amount">${escapeHtml(formatCurrency(emp.salario_base))}</span>
        </div>
        <div class="pay-row">
          <span>
            ${escapeHtml(etiquetaBono)} ·
            <strong class="${emp.acreedor_bono_efectivo ? 'txt-blue' : 'txt-rose'}">${
              emp.acreedor_bono_efectivo ? 'Válido' : 'Inválido'
            }</strong>
            <span style="color:#64748b;font-size:9px;">(${escapeHtml(emp.motivo_bono)})</span>
          </span>
          <span class="pay-amount ${emp.monto_bono > 0 ? 'txt-blue' : 'txt-muted'}">
            ${emp.monto_bono > 0 ? `+ ${escapeHtml(formatCurrency(emp.monto_bono))}` : formatCurrency(0)}
          </span>
        </div>
        ${
          emp.ajuste_manual > 0
            ? `<div class="pay-row">
                <span>Ajuste / Percepción adicional ${emp.nota_ajuste ? `(${escapeHtml(emp.nota_ajuste)})` : ''}</span>
                <span class="pay-amount txt-blue">+ ${escapeHtml(formatCurrency(emp.ajuste_manual))}</span>
              </div>`
            : ''
        }
        <div class="pay-row total-row">
          <span>Total Percepciones</span>
          <span class="pay-amount">${escapeHtml(formatCurrency(totalPercepciones))}</span>
        </div>
      </div>

      <div class="pay-card">
        <div class="pay-card-header">Deducciones</div>
        <div class="pay-row">
          <span>Faltas injustificadas (${emp.faltas} × ${escapeHtml(formatCurrency(emp.salario_diario))})</span>
          <span class="pay-amount ${emp.descuento > 0 ? 'txt-rose' : 'txt-muted'}">
            ${emp.descuento > 0 ? `- ${escapeHtml(formatCurrency(emp.descuento))}` : formatCurrency(0)}
          </span>
        </div>
        <div class="pay-row">
          <span>Retardos registrados (${emp.retardos}) · Descansos/Festivos (${emp.dias_justificados})</span>
          <span class="pay-amount txt-muted">${formatCurrency(0)}</span>
        </div>
        ${
          emp.ajuste_manual < 0
            ? `<div class="pay-row">
                <span>Deducción adicional ${emp.nota_ajuste ? `(${escapeHtml(emp.nota_ajuste)})` : ''}</span>
                <span class="pay-amount txt-rose">- ${escapeHtml(formatCurrency(Math.abs(emp.ajuste_manual)))}</span>
              </div>`
            : ''
        }
        <div class="pay-row total-row">
          <span>Total Deducciones</span>
          <span class="pay-amount ${totalDeducciones > 0 ? 'txt-rose' : ''}">
            ${totalDeducciones > 0 ? `- ${escapeHtml(formatCurrency(totalDeducciones))}` : formatCurrency(0)}
          </span>
        </div>
      </div>
    </section>

    <div class="neto-banner">
      <div>
        <div class="nb-title">Neto Total a Pagar al Colaborador</div>
        <div class="nb-sub">Días trabajados: ${emp.dias_trabajados} · Descansos/Festivos/Vacaciones: ${emp.dias_justificados} · Retardos: ${emp.retardos} · Faltas: ${emp.faltas}</div>
      </div>
      <div class="nb-val">${escapeHtml(formatCurrency(emp.salario_neto))}</div>
    </div>

    <div class="branch-section">
      <div class="branch-banner">
        <h2>Desglose diario de asistencia del período</h2>
        <span class="branch-count">${(emp.dias || []).length} días en el período</span>
      </div>
      <table class="summary-table">
        <thead>
          <tr>
            <th class="col-num">#</th>
            <th class="col-fecha">Fecha</th>
            <th class="col-dia">Día</th>
            <th>Estatus / Incidencia</th>
            <th class="col-hora">Entrada</th>
            <th class="col-hora">Salida</th>
            <th class="col-bono">Bono</th>
            <th class="col-money">Impacto</th>
          </tr>
        </thead>
        <tbody>
          ${filasDias}
        </tbody>
      </table>
    </div>

    <footer class="doc-footer">
      <div class="signature-box">
        <div class="signature-line"></div>
        <strong>Firma de Conformidad del Colaborador</strong>
        <span class="signature-sub">${escapeHtml(emp.nombre_completo)}</span>
      </div>
      <div class="signature-box">
        <div class="signature-line"></div>
        <strong>Autorizó Recursos Humanos</strong>
        <span class="signature-sub">UNIFAM · Control de Nómina</span>
      </div>
    </footer>
  </div>
</body>
</html>`;
}

export function AdminNomina() {
  const { mostrarAlerta } = useAlert();

  const [tipo, setTipo] = useState('quincenal');
  const [fecha, setFecha] = useState(getToday);
  const [fechaInicioCustom, setFechaInicioCustom] = useState(getMonthStart);
  const [fechaFinCustom, setFechaFinCustom] = useState(getToday);
  const [sucursalFiltro, setSucursalFiltro] = useState('');
  const [busquedaNombre, setBusquedaNombre] = useState('');
  const [sucursales, setSucursales] = useState([]);

  // Configuración del Bono de Puntualidad (persistida en localStorage)
  const [bonoConfig, setBonoConfig] = useState(() => {
    try {
      const guardado = localStorage.getItem(STORAGE_BONO_KEY);
      if (guardado) {
        const parsed = JSON.parse(guardado);
        return {
          modo: ['porcentaje', 'fijo', 'ninguno'].includes(parsed.modo)
            ? parsed.modo
            : 'porcentaje',
          valor: parsed.valor !== undefined ? String(parsed.valor) : '10',
        };
      }
    } catch {
      // Ignorar errores de lectura de localStorage
    }
    return { modo: 'porcentaje', valor: '10' };
  });

  // Ajustes manuales opcionales por empleado en la sesión { [empleado_id]: { forzarBono: null | boolean, ajusteMonto: number, nota: string } }
  const [ajustesEmpleados, setAjustesEmpleados] = useState({});

  const [nominaBase, setNominaBase] = useState([]);
  const [empleadosSinPuesto, setEmpleadosSinPuesto] = useState([]);
  const [periodo, setPeriodo] = useState(null);
  const [empleadoModalId, setEmpleadoModalId] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [imprimiendo, setImprimiendo] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_BONO_KEY, JSON.stringify(bonoConfig));
    } catch {
      // Ignorar errores de escritura
    }
  }, [bonoConfig]);

  useEffect(() => {
    api
      .get('/sucursales')
      .then((res) => {
        setSucursales(res.data.filter((s) => s.activo !== false));
      })
      .catch((error) => {
        console.error('Error al cargar sucursales:', error);
      });
  }, []);

  const calcularNomina = useCallback(async () => {
    if (tipo === 'personalizado' && fechaInicioCustom > fechaFinCustom) {
      mostrarAlerta('La fecha inicial no puede ser mayor que la fecha final.', 'warning');
      return;
    }

    setCargando(true);
    try {
      const params = new URLSearchParams({
        tipo,
        fecha,
        bono_modo: bonoConfig.modo,
        bono_valor: String(Number(bonoConfig.valor) || 0),
      });
      if (tipo === 'personalizado') {
        params.set('fecha_inicio', fechaInicioCustom);
        params.set('fecha_fin', fechaFinCustom);
      }
      if (sucursalFiltro) {
        params.set('sucursal_id', sucursalFiltro);
      }

      const { data } = await api.get(`/nomina/calcular?${params.toString()}`);
      setNominaBase(Array.isArray(data.nomina) ? data.nomina : []);
      setEmpleadosSinPuesto(
        Array.isArray(data.empleados_sin_puesto) ? data.empleados_sin_puesto : []
      );
      setPeriodo(data.periodo || null);
    } catch (error) {
      console.error('Error al calcular la nómina:', error);
      mostrarAlerta('No se pudo calcular la nómina del período seleccionado.', 'error');
    } finally {
      setCargando(false);
    }
  }, [tipo, fecha, fechaInicioCustom, fechaFinCustom, sucursalFiltro, bonoConfig.modo, bonoConfig.valor, mostrarAlerta]);

  useEffect(() => {
    calcularNomina();
  }, [calcularNomina]);

  // Recalcula en tiempo real al cambiar el monto/porcentaje de bono o ajustes individuales
  const nominaCalculada = useMemo(() => {
    const valorBonoNum = Math.max(0, Number(bonoConfig.valor) || 0);

    return nominaBase.map((emp) => {
      const ajuste = ajustesEmpleados[emp.empleado_id] || {};
      const evalBono = evaluarBonoEstrictoEmpleado(emp);
      const acreedorBase = Boolean(emp.acreedor_bono && evalBono.valido);
      const acreedorEfectivo =
        typeof ajuste.forzarBono === 'boolean' ? ajuste.forzarBono : acreedorBase;

      let montoBono = 0;
      if (acreedorEfectivo) {
        if (bonoConfig.modo === 'porcentaje') {
          montoBono = round2(emp.salario_base * (valorBonoNum / 100));
        } else if (bonoConfig.modo === 'fijo') {
          montoBono = round2(valorBonoNum);
        }
      }

      const ajusteManual = round2(Number(ajuste.ajusteMonto) || 0);
      const salarioNeto = round2(
        Math.max(0, emp.salario_base - emp.descuento + montoBono + ajusteManual)
      );

      return {
        ...emp,
        acreedor_bono: acreedorBase,
        acreedor_bono_efectivo: acreedorEfectivo,
        bono_forzado: typeof ajuste.forzarBono === 'boolean',
        motivo_bono:
          typeof ajuste.forzarBono === 'boolean'
            ? ajuste.forzarBono
              ? 'Válido · Otorgado manualmente por administración'
              : 'Inválido · Retirado manualmente por administración'
            : evalBono.motivo || emp.motivo_bono,
        monto_bono: montoBono,
        ajuste_manual: ajusteManual,
        nota_ajuste: ajuste.nota || '',
        salario_neto: salarioNeto,
      };
    });
  }, [nominaBase, bonoConfig, ajustesEmpleados]);

  const nominaFiltrada = useMemo(() => {
    const query = busquedaNombre.trim().toLowerCase();
    if (!query) return nominaCalculada;
    return nominaCalculada.filter(
      (emp) =>
        (emp.nombre_completo || '').toLowerCase().includes(query) ||
        (emp.puesto || '').toLowerCase().includes(query)
    );
  }, [nominaCalculada, busquedaNombre]);

  const resumenTotales = useMemo(() => {
    return nominaFiltrada.reduce(
      (acc, emp) => {
        acc.sueldoBase = round2(acc.sueldoBase + emp.salario_base);
        acc.descuentos = round2(acc.descuentos + emp.descuento);
        acc.bonos = round2(acc.bonos + emp.monto_bono);
        acc.ajustes = round2(acc.ajustes + (emp.ajuste_manual || 0));
        acc.neto = round2(acc.neto + emp.salario_neto);
        acc.faltas += Number(emp.faltas || 0);
        acc.retardos += Number(emp.retardos || 0);
        if (emp.acreedor_bono_efectivo && emp.monto_bono > 0) {
          acc.acreedoresBono += 1;
        }
        return acc;
      },
      {
        sueldoBase: 0,
        descuentos: 0,
        bonos: 0,
        ajustes: 0,
        neto: 0,
        faltas: 0,
        retardos: 0,
        acreedoresBono: 0,
      }
    );
  }, [nominaFiltrada]);

  const empleadoModal = useMemo(
    () => nominaCalculada.find((e) => e.empleado_id === empleadoModalId) || null,
    [nominaCalculada, empleadoModalId]
  );

  const seleccionarAtajoPeriodo = (atajo) => {
    const hoy = new Date();
    if (atajo === '1ra_quincena') {
      setTipo('quincenal');
      setFecha(toLocalISODate(new Date(hoy.getFullYear(), hoy.getMonth(), 10)));
    } else if (atajo === '2da_quincena') {
      setTipo('quincenal');
      setFecha(toLocalISODate(new Date(hoy.getFullYear(), hoy.getMonth(), 20)));
    } else if (atajo === 'quincena_anterior') {
      setTipo('quincenal');
      if (hoy.getDate() <= 15) {
        const mesAnterior = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 20);
        setFecha(toLocalISODate(mesAnterior));
      } else {
        setFecha(toLocalISODate(new Date(hoy.getFullYear(), hoy.getMonth(), 10)));
      }
    } else if (atajo === 'semana_actual') {
      setTipo('semanal');
      setFecha(getToday());
    } else if (atajo === 'mes_actual') {
      setTipo('mensual');
      setFecha(getToday());
    }
  };

  const actualizarAjusteEmpleado = (empleadoId, cambios) => {
    setAjustesEmpleados((prev) => ({
      ...prev,
      [empleadoId]: {
        ...(prev[empleadoId] || { forzarBono: null, ajusteMonto: '', nota: '' }),
        ...cambios,
      },
    }));
  };

  const lanzarImpresionIframe = (html) => {
    setImprimiendo(true);
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
        setImprimiendo(false);
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

  const imprimirNominaGeneral = () => {
    if (nominaFiltrada.length === 0) return;

    const sucursalNombre = !sucursalFiltro
      ? 'Todas las sucursales'
      : sucursales.find((s) => String(s.id) === String(sucursalFiltro))?.nombre ||
        'Sucursal seleccionada';

    const html = generarDocumentoNominaGeneral({
      empleados: nominaFiltrada,
      periodo,
      sucursalNombre,
      busquedaNombre: busquedaNombre.trim(),
      bonoModo: bonoConfig.modo,
      bonoValor: bonoConfig.valor,
    });

    lanzarImpresionIframe(html);
  };

  const imprimirReciboIndividual = (emp) => {
    if (!emp) return;

    const html = generarReciboNominaIndividual({
      emp,
      periodo,
      bonoModo: bonoConfig.modo,
      bonoValor: bonoConfig.valor,
    });

    lanzarImpresionIframe(html);
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
              Nómina
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              Cálculo basado en sueldo quincenal (÷ 15 días), asistencia real, días festivos, descansos y ausencias aprobadas.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={calcularNomina}
              disabled={cargando}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-slate-200 transition hover:bg-white/10 disabled:opacity-50"
            >
              <RefreshCw size={16} className={cargando ? 'animate-spin text-cyan-400' : ''} />
              <span>Actualizar</span>
            </button>

            {nominaFiltrada.length > 0 && (
              <button
                type="button"
                onClick={imprimirNominaGeneral}
                disabled={imprimiendo || cargando}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-cyan-600 px-4 py-3 text-sm font-medium text-white shadow-lg shadow-cyan-950/30 transition hover:bg-cyan-500 active:scale-[0.99] disabled:opacity-50 sm:flex-initial"
              >
                <Printer size={18} />
                <span>{imprimiendo ? 'Generando...' : 'Imprimir nómina'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Panel de Configuración y Filtros Liquid Glass */}
        <div className="rounded-3xl border border-white/10 bg-white/4 p-4 shadow-[0_20px_60px_rgba(0,0,0,0.18)] backdrop-blur-xl sm:p-5">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
            {/* Buscador */}
            <div className="md:col-span-3">
              <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                Buscar colaborador
              </label>
              <div className="relative">
                <Search
                  size={16}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  value={busquedaNombre}
                  onChange={(e) => setBusquedaNombre(e.target.value)}
                  placeholder="Nombre o puesto..."
                  className="w-full rounded-xl border border-white/5 bg-black/20 py-2.5 pl-9 pr-8 text-sm text-white placeholder-slate-500 shadow-inner transition focus:border-cyan-400 focus:bg-white/10 focus:outline-none"
                />
                {busquedaNombre && (
                  <button
                    type="button"
                    onClick={() => setBusquedaNombre('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 hover:bg-white/10 hover:text-white"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* Sucursal */}
            <div className="md:col-span-3">
              <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                Sucursal
              </label>
              <div className="relative">
                <Building
                  size={16}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <select
                  value={sucursalFiltro}
                  onChange={(e) => setSucursalFiltro(e.target.value)}
                  className="w-full rounded-xl border border-white/5 bg-black/20 py-2.5 pl-9 pr-4 text-sm text-white shadow-inner transition focus:border-cyan-400 focus:bg-white/10 focus:outline-none"
                >
                  <option value="" className="bg-slate-900 text-white">
                    Todas las sucursales
                  </option>
                  {sucursales.map((s) => (
                    <option key={s.id} value={s.id} className="bg-slate-900 text-white">
                      {s.nombre}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Tipo de período */}
            <div className="md:col-span-2">
              <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                Tipo de período
              </label>
              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
                className="w-full rounded-xl border border-white/5 bg-black/20 px-3 py-2.5 text-sm text-white shadow-inner transition focus:border-cyan-400 focus:bg-white/10 focus:outline-none"
              >
                <option value="quincenal" className="bg-slate-900 text-white">
                  Quincenal (15 días)
                </option>
                <option value="semanal" className="bg-slate-900 text-white">
                  Semanal (7 días)
                </option>
                <option value="mensual" className="bg-slate-900 text-white">
                  Mensual (30 días)
                </option>
                <option value="personalizado" className="bg-slate-900 text-white">
                  Rango libre
                </option>
              </select>
            </div>

            {/* Fecha de referencia o Rango personalizado */}
            {tipo !== 'personalizado' ? (
              <div className="md:col-span-4">
                <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Fecha dentro del período a calcular
                </label>
                <input
                  type="date"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  className="w-full rounded-xl border border-white/5 bg-black/20 px-3 py-2.5 text-sm text-white shadow-inner transition focus:border-cyan-400 focus:bg-white/10 focus:outline-none"
                />
              </div>
            ) : (
              <>
                <div className="md:col-span-2">
                  <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Desde
                  </label>
                  <input
                    type="date"
                    value={fechaInicioCustom}
                    onChange={(e) => setFechaInicioCustom(e.target.value)}
                    className="w-full rounded-xl border border-white/5 bg-black/20 px-3 py-2.5 text-sm text-white shadow-inner transition focus:border-cyan-400 focus:bg-white/10 focus:outline-none"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Hasta
                  </label>
                  <input
                    type="date"
                    value={fechaFinCustom}
                    onChange={(e) => setFechaFinCustom(e.target.value)}
                    className="w-full rounded-xl border border-white/5 bg-black/20 px-3 py-2.5 text-sm text-white shadow-inner transition focus:border-cyan-400 focus:bg-white/10 focus:outline-none"
                  />
                </div>
              </>
            )}
          </div>

          {/* Segunda fila: Configuración de Bono de Puntualidad y Atajos */}
          <div className="mt-4 flex flex-col gap-3 border-t border-white/5 pt-4 lg:flex-row lg:items-center lg:justify-between">
            {/* Atajos rápidos de período */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] uppercase tracking-wider text-slate-500">
                Corte rápido:
              </span>
              <button
                type="button"
                onClick={() => seleccionarAtajoPeriodo('1ra_quincena')}
                className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-slate-300 transition hover:border-cyan-400/30 hover:bg-cyan-500/10 hover:text-cyan-200"
              >
                1ra Quincena
              </button>
              <button
                type="button"
                onClick={() => seleccionarAtajoPeriodo('2da_quincena')}
                className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-slate-300 transition hover:border-cyan-400/30 hover:bg-cyan-500/10 hover:text-cyan-200"
              >
                2da Quincena
              </button>
              <button
                type="button"
                onClick={() => seleccionarAtajoPeriodo('quincena_anterior')}
                className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-slate-300 transition hover:border-cyan-400/30 hover:bg-cyan-500/10 hover:text-cyan-200"
              >
                Quincena anterior
              </button>
              <button
                type="button"
                onClick={() => seleccionarAtajoPeriodo('semana_actual')}
                className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-slate-300 transition hover:border-cyan-400/30 hover:bg-cyan-500/10 hover:text-cyan-200"
              >
                Semana actual
              </button>
              <button
                type="button"
                onClick={() => seleccionarAtajoPeriodo('mes_actual')}
                className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-slate-300 transition hover:border-cyan-400/30 hover:bg-cyan-500/10 hover:text-cyan-200"
              >
                Mes completo
              </button>
            </div>

            {/* Regla de Bono de Puntualidad */}
            <div className="flex flex-wrap items-center gap-2.5 rounded-2xl border border-cyan-400/15 bg-cyan-500/5 px-3.5 py-2">
              <div className="flex items-center gap-1.5 text-xs font-medium text-cyan-200">
                <Award size={15} className="text-cyan-400" />
                <span>Bono de puntualidad (0 faltas y 0 retardos):</span>
              </div>

              <select
                value={bonoConfig.modo}
                onChange={(e) => setBonoConfig((prev) => ({ ...prev, modo: e.target.value }))}
                className="rounded-lg border border-white/10 bg-slate-900/90 px-2.5 py-1 text-xs text-white focus:border-cyan-400 focus:outline-none"
              >
                <option value="porcentaje">% del sueldo período</option>
                <option value="fijo">Monto fijo ($ MXN)</option>
                <option value="ninguno">Sin bono ($0)</option>
              </select>

              {bonoConfig.modo !== 'ninguno' && (
                <div className="relative w-28">
                  <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                    {bonoConfig.modo === 'fijo' ? '$' : '%'}
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={bonoConfig.valor}
                    onChange={(e) =>
                      setBonoConfig((prev) => ({ ...prev, valor: e.target.value }))
                    }
                    className="w-full rounded-lg border border-white/10 bg-slate-900/90 py-1 pl-6 pr-2 text-right font-mono text-xs text-white focus:border-cyan-400 focus:outline-none"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Alerta de colaboradores sin puesto asignado */}
        {empleadosSinPuesto.length > 0 && (
          <div className="flex items-start gap-3 rounded-2xl border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-xs text-amber-200">
            <AlertTriangle size={17} className="mt-0.5 shrink-0 text-amber-400" />
            <div>
              <strong className="font-semibold">
                Atención: {empleadosSinPuesto.length}{' '}
                {empleadosSinPuesto.length === 1
                  ? 'colaborador activo no tiene'
                  : 'colaboradores activos no tienen'}{' '}
                un puesto con salario asignado:
              </strong>{' '}
              {empleadosSinPuesto.map((e) => e.nombre_completo).join(', ')}. Asígnales un puesto en el módulo de{' '}
              <em>Empleados</em> para incluirlos en el cálculo de nómina.
            </div>
          </div>
        )}

        {/* Tarjetas de Resumen Ejecutivo */}
        {periodo && !cargando && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <div className="rounded-2xl border border-white/10 bg-white/4 p-4 backdrop-blur-xl">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                Período de pago
              </p>
              <p className="mt-1.5 text-base font-semibold text-white">
                {formatearFecha(periodo.inicio)} → {formatearFecha(periodo.fin)}
              </p>
              <p className="mt-1 text-xs text-cyan-300/80">
                {periodo.etiqueta} · Base {periodo.dias_base_pago} días
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/4 p-4 backdrop-blur-xl">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                Subtotal Sueldos Base
              </p>
              <p className="mt-1.5 font-mono text-xl font-semibold text-white">
                {formatCurrency(resumenTotales.sueldoBase)}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                {nominaFiltrada.length}{' '}
                {nominaFiltrada.length === 1 ? 'colaborador activo' : 'colaboradores activos'}
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/4 p-4 backdrop-blur-xl">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                Descuento por Faltas
              </p>
              <p className="mt-1.5 font-mono text-xl font-semibold text-rose-300">
                - {formatCurrency(resumenTotales.descuentos)}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                {resumenTotales.faltas}{' '}
                {resumenTotales.faltas === 1 ? 'falta injustificada' : 'faltas injustificadas'} ·{' '}
                {resumenTotales.retardos} {resumenTotales.retardos === 1 ? 'retardo' : 'retardos'}
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/4 p-4 backdrop-blur-xl">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                Bonos de Puntualidad
              </p>
              <p className="mt-1.5 font-mono text-xl font-semibold text-cyan-300">
                + {formatCurrency(resumenTotales.bonos + resumenTotales.ajustes)}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                {resumenTotales.acreedoresBono}{' '}
                {resumenTotales.acreedoresBono === 1
                  ? 'colaborador acreedor'
                  : 'colaboradores acreedores'}
              </p>
            </div>

            <div className="rounded-2xl border border-emerald-400/25 bg-emerald-500/10 p-4 shadow-lg shadow-emerald-950/20 backdrop-blur-xl">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-300">
                Total Neto a Pagar
              </p>
              <p className="mt-1.5 font-mono text-2xl font-bold text-emerald-300">
                {formatCurrency(resumenTotales.neto)}
              </p>
              <p className="mt-1 text-xs text-emerald-200/70">
                Sueldo base − faltas + bonos
              </p>
            </div>
          </div>
        )}

        {/* Contenido principal */}
        {cargando ? (
          <div className="flex min-h-64 flex-col items-center justify-center rounded-3xl border border-white/10 bg-white/3 p-12 text-center backdrop-blur-xl">
            <Clock3 className="mb-3 h-10 w-10 animate-spin text-cyan-400" />
            <p className="text-sm tracking-wide text-slate-300">
              Calculando nómina y verificando asistencias, descansos, festivos y ausencias...
            </p>
          </div>
        ) : nominaFiltrada.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-white/10 bg-white/3 px-6 py-16 text-center">
            <Users className="mx-auto mb-4 text-slate-600" size={34} />
            <p className="font-medium text-slate-300">
              No se encontraron colaboradores para calcular la nómina
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Verifica que los colaboradores estén activos, tengan un puesto asignado o ajusta los filtros de búsqueda.
            </p>
          </div>
        ) : (
          <>
            {/* Vista Móvil (Tarjetas) */}
            <div className="grid gap-3 md:hidden">
              {nominaFiltrada.map((emp) => (
                <article
                  key={emp.empleado_id}
                  className="rounded-2xl border border-white/10 bg-white/4 p-4 shadow-lg shadow-black/10 backdrop-blur-xl"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="truncate font-semibold text-white">{emp.nombre_completo}</h2>
                      <p className="mt-0.5 text-xs text-slate-400">
                        {emp.puesto} · Diario: {formatCurrency(emp.salario_diario)}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full border border-cyan-400/20 bg-cyan-500/10 px-2.5 py-1 text-[11px] font-medium text-cyan-200">
                      {emp.sucursal_nombre}
                    </span>
                  </div>

                  <dl className="mt-3 grid grid-cols-4 gap-1.5 text-center text-xs">
                    <div className="rounded-xl bg-black/20 py-2">
                      <dt className="text-[9px] uppercase text-slate-500">Trab.</dt>
                      <dd className="mt-0.5 font-semibold text-emerald-300">
                        {emp.dias_trabajados}
                      </dd>
                    </div>
                    <div className="rounded-xl bg-black/20 py-2">
                      <dt className="text-[9px] uppercase text-slate-500">Justif.</dt>
                      <dd className="mt-0.5 font-semibold text-blue-300">
                        {emp.dias_justificados}
                      </dd>
                    </div>
                    <div className="rounded-xl bg-black/20 py-2">
                      <dt className="text-[9px] uppercase text-slate-500">Retardos</dt>
                      <dd className="mt-0.5 font-semibold text-amber-300">{emp.retardos}</dd>
                    </div>
                    <div className="rounded-xl bg-black/20 py-2">
                      <dt className="text-[9px] uppercase text-slate-500">Faltas</dt>
                      <dd className="mt-0.5 font-semibold text-rose-300">{emp.faltas}</dd>
                    </div>
                  </dl>

                  <div className="mt-3 space-y-1.5 border-y border-white/5 py-2.5 text-xs">
                    <div className="flex justify-between text-slate-300">
                      <span>Sueldo del período ({emp.dias_base_pago}d):</span>
                      <span className="font-mono">{formatCurrency(emp.salario_base)}</span>
                    </div>
                    <div className="flex justify-between text-rose-300">
                      <span>Descuento por faltas ({emp.faltas}):</span>
                      <span className="font-mono">- {formatCurrency(emp.descuento)}</span>
                    </div>
                    <div className="flex justify-between text-cyan-300">
                      <span>Bono de puntualidad:</span>
                      <span className="font-mono">+ {formatCurrency(emp.monto_bono)}</span>
                    </div>
                    <div className="flex justify-between pt-1 text-sm font-semibold text-emerald-300">
                      <span>Neto a pagar:</span>
                      <span className="font-mono">{formatCurrency(emp.salario_neto)}</span>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => imprimirReciboIndividual(emp)}
                      disabled={imprimiendo}
                      title="Imprimir recibo individual"
                      className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 transition hover:bg-white/10 hover:text-white disabled:opacity-50"
                    >
                      <Printer size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setEmpleadoModalId(emp.empleado_id)}
                      className="inline-flex h-10 items-center gap-2 rounded-xl border border-cyan-400/20 bg-cyan-500/10 px-3 text-sm font-medium text-cyan-100 transition hover:bg-cyan-500/20"
                    >
                      <Eye size={16} />
                      <span>Desglose</span>
                    </button>
                  </div>
                </article>
              ))}
            </div>

            {/* Vista Escritorio (Tabla) */}
            <div className="hidden overflow-hidden rounded-3xl border border-white/10 bg-white/4 shadow-[0_20px_60px_rgba(0,0,0,0.18)] backdrop-blur-xl md:block">
              <div className="overflow-x-auto">
                <table className="w-full min-w-250 border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/2">
                      <th className="px-5 py-4 text-left text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                        Colaborador / Puesto
                      </th>
                      <th className="px-4 py-4 text-left text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                        Sucursal
                      </th>
                      <th className="px-4 py-4 text-right text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                        Sueldo Qna / Diario
                      </th>
                      <th className="px-3 py-4 text-center text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                        Trab.
                      </th>
                      <th className="px-3 py-4 text-center text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                        Desc./Just.
                      </th>
                      <th className="px-3 py-4 text-center text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                        Ret.
                      </th>
                      <th className="px-3 py-4 text-center text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                        Faltas
                      </th>
                      <th className="px-4 py-4 text-right text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                        Sueldo Período
                      </th>
                      <th className="px-4 py-4 text-right text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                        Descuento
                      </th>
                      <th className="px-4 py-4 text-right text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                        Bono Punt.
                      </th>
                      <th className="px-4 py-4 text-right text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                        Salario Neto
                      </th>
                      <th className="px-5 py-4 text-center text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {nominaFiltrada.map((emp) => (
                      <tr
                        key={emp.empleado_id}
                        className="border-b border-white/5 transition hover:bg-cyan-500/5"
                      >
                        <td className="px-5 py-4">
                          <div className="font-medium text-white">{emp.nombre_completo}</div>
                          <div className="text-xs text-slate-400">{emp.puesto}</div>
                        </td>
                        <td className="px-4 py-4">
                          <span className="inline-block rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-1 text-xs font-medium text-cyan-200">
                            {emp.sucursal_nombre}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-right font-mono text-xs">
                          <div className="text-slate-200">
                            {formatCurrency(emp.salario_quincenal)}{' '}
                            <span className="text-[10px] text-slate-500">/qna</span>
                          </div>
                          <div className="text-slate-400">
                            {formatCurrency(emp.salario_diario)}{' '}
                            <span className="text-[10px] text-slate-500">/día</span>
                          </div>
                        </td>
                        <td className="px-3 py-4 text-center">
                          <span className="inline-flex min-w-7 items-center justify-center rounded-full border border-emerald-400/20 bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-300">
                            {emp.dias_trabajados}
                          </span>
                        </td>
                        <td className="px-3 py-4 text-center">
                          <span
                            title={`Descansos: ${emp.dias_descanso} · Festivos: ${emp.dias_festivos} · Vacaciones: ${emp.dias_vacaciones} · Permisos: ${emp.dias_permiso}`}
                            className="inline-flex min-w-7 items-center justify-center rounded-full border border-blue-400/20 bg-blue-500/10 px-2 py-0.5 text-xs font-semibold text-blue-300"
                          >
                            {emp.dias_justificados}
                          </span>
                        </td>
                        <td className="px-3 py-4 text-center">
                          <span
                            className={`inline-flex min-w-7 items-center justify-center rounded-full border px-2 py-0.5 text-xs font-semibold ${
                              emp.retardos > 0
                                ? 'border-amber-400/20 bg-amber-500/10 text-amber-300'
                                : 'border-white/10 bg-white/5 text-slate-400'
                            }`}
                          >
                            {emp.retardos}
                          </span>
                        </td>
                        <td className="px-3 py-4 text-center">
                          <span
                            className={`inline-flex min-w-7 items-center justify-center rounded-full border px-2 py-0.5 text-xs font-semibold ${
                              emp.faltas > 0
                                ? 'border-rose-400/20 bg-rose-500/10 text-rose-300'
                                : 'border-white/10 bg-white/5 text-slate-400'
                            }`}
                          >
                            {emp.faltas}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-right font-mono text-sm text-slate-200">
                          {formatCurrency(emp.salario_base)}
                        </td>
                        <td className="px-4 py-4 text-right font-mono text-sm">
                          {emp.descuento > 0 ? (
                            <span className="font-medium text-rose-300">
                              - {formatCurrency(emp.descuento)}
                            </span>
                          ) : (
                            <span className="text-slate-500">{formatCurrency(0)}</span>
                          )}
                        </td>
                        <td className="px-4 py-4 text-right font-mono text-sm">
                          {emp.monto_bono > 0 ? (
                            <div>
                              <span className="font-medium text-cyan-300">
                                + {formatCurrency(emp.monto_bono)}
                              </span>
                              <span className="block text-[10px] font-sans font-semibold text-emerald-400">
                                Válido
                              </span>
                            </div>
                          ) : (
                            <div>
                              <span className="text-slate-500">{formatCurrency(0)}</span>
                              <span
                                className={`block text-[10px] font-sans font-semibold ${
                                  emp.acreedor_bono_efectivo
                                    ? 'text-emerald-400'
                                    : 'text-rose-400'
                                }`}
                              >
                                {emp.acreedor_bono_efectivo ? 'Válido ($0)' : 'Inválido'}
                              </span>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-4 text-right font-mono text-sm font-bold text-emerald-300">
                          {formatCurrency(emp.salario_neto)}
                          {emp.ajuste_manual !== 0 && (
                            <span className="block text-[10px] font-normal text-amber-300">
                              Ajuste: {emp.ajuste_manual > 0 ? '+' : ''}
                              {formatCurrency(emp.ajuste_manual)}
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => setEmpleadoModalId(emp.empleado_id)}
                              title="Ver desglose detallado y recibo"
                              className="inline-flex items-center gap-1.5 rounded-xl border border-cyan-400/20 bg-cyan-500/10 px-3 py-2 text-xs font-medium text-cyan-300 transition hover:bg-cyan-500/20"
                            >
                              <Eye size={15} />
                              <span>Ver</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => imprimirReciboIndividual(emp)}
                              disabled={imprimiendo}
                              title="Imprimir recibo individual de nómina"
                              className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 p-2 text-slate-300 transition hover:bg-white/10 hover:text-white disabled:opacity-50"
                            >
                              <Printer size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-white/10 bg-white/3 font-semibold">
                      <td colSpan={7} className="px-5 py-4 text-right text-xs uppercase tracking-wider text-slate-400">
                        Totales del período ({nominaFiltrada.length} colaboradores):
                      </td>
                      <td className="px-4 py-4 text-right font-mono text-sm text-white">
                        {formatCurrency(resumenTotales.sueldoBase)}
                      </td>
                      <td className="px-4 py-4 text-right font-mono text-sm text-rose-300">
                        - {formatCurrency(resumenTotales.descuentos)}
                      </td>
                      <td className="px-4 py-4 text-right font-mono text-sm text-cyan-300">
                        + {formatCurrency(resumenTotales.bonos)}
                      </td>
                      <td className="px-4 py-4 text-right font-mono text-base font-bold text-emerald-300">
                        {formatCurrency(resumenTotales.neto)}
                      </td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modal Liquid Glass con Desglose Matemático y Bitácora Diaria del Empleado */}
      {empleadoModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-3 backdrop-blur-md sm:p-4"
          onClick={() => setEmpleadoModalId(null)}
        >
          <div
            className="flex max-h-[calc(100dvh-1.5rem)] w-full max-w-3xl flex-col overflow-hidden rounded-[1.75rem] border border-white/10 bg-slate-950/90 shadow-[0_24px_80px_rgba(0,0,0,0.6)] backdrop-blur-3xl sm:max-h-[calc(100dvh-2rem)]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header del modal */}
            <div className="flex items-start justify-between gap-3 border-b border-white/10 px-5 pb-4 pt-5 sm:px-7 sm:pb-5 sm:pt-6">
              <div className="min-w-0">
                <p className="mb-0.5 text-[11px] font-medium uppercase tracking-widest text-cyan-400">
                  {empleadoModal.sucursal_nombre} · {formatearFecha(periodo?.inicio)} →{' '}
                  {formatearFecha(periodo?.fin)}
                </p>
                <h2 className="m-0 truncate text-lg font-medium tracking-wide text-white sm:text-xl">
                  {empleadoModal.nombre_completo}
                </h2>
                <p className="mt-1 text-xs text-slate-400">
                  {empleadoModal.puesto} · Horario:{' '}
                  <strong className="font-mono text-slate-200">
                    {formatearHorarioTurno(
                      empleadoModal.turno_hora_inicio,
                      empleadoModal.turno_hora_fin
                    )}
                  </strong>{' '}
                  · Salario Quincenal:{' '}
                  <strong className="font-mono text-slate-200">
                    {formatCurrency(empleadoModal.salario_quincenal)}
                  </strong>{' '}
                  · Salario Diario (÷15):{' '}
                  <strong className="font-mono text-cyan-300">
                    {formatCurrency(empleadoModal.salario_diario)}
                  </strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEmpleadoModalId(null)}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-gray-400 transition hover:bg-white/10 hover:text-gray-200"
              >
                <X size={16} />
              </button>
            </div>

            {/* Cuerpo scrollable */}
            <div className="flex flex-col gap-5 overflow-y-auto px-5 py-5 sm:px-7">
              {/* Tarjetas de fórmula financiera */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {/* Percepciones */}
                <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                  <div className="mb-3 flex items-center justify-between border-b border-white/5 pb-2">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-300">
                      Percepciones
                    </span>
                    <DollarSign size={15} className="text-emerald-400" />
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between text-slate-300">
                      <span>Sueldo del período ({empleadoModal.dias_base_pago} días base):</span>
                      <span className="font-mono font-medium text-white">
                        {formatCurrency(empleadoModal.salario_base)}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span>
                        Bono de puntualidad (
                        <strong
                          className={
                            empleadoModal.acreedor_bono_efectivo
                              ? 'text-emerald-300'
                              : 'text-rose-300'
                          }
                        >
                          {empleadoModal.acreedor_bono_efectivo ? 'Válido' : 'Inválido'}
                        </strong>
                        ):
                      </span>
                      <span className="font-mono font-medium text-cyan-300">
                        + {formatCurrency(empleadoModal.monto_bono)}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">{empleadoModal.motivo_bono}</p>
                  </div>
                </div>

                {/* Deducciones */}
                <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                  <div className="mb-3 flex items-center justify-between border-b border-white/5 pb-2">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-rose-300">
                      Deducciones e Incidencias
                    </span>
                    <MinusCircle size={15} className="text-rose-400" />
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between text-slate-300">
                      <span>
                        Faltas injustificadas ({empleadoModal.faltas} ×{' '}
                        {formatCurrency(empleadoModal.salario_diario)}):
                      </span>
                      <span className="font-mono font-medium text-rose-300">
                        - {formatCurrency(empleadoModal.descuento)}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span>
                        Descansos ({empleadoModal.dias_descanso}), Festivos (
                        {empleadoModal.dias_festivos}), Vac./Perm. (
                        {empleadoModal.dias_vacaciones + empleadoModal.dias_permiso}):
                      </span>
                      <span className="font-mono text-emerald-300">Pagados 100%</span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Retardos en el período: {empleadoModal.retardos} (no descuentan salario base)
                    </p>
                  </div>
                </div>
              </div>

              {/* Ajuste manual opcional para este colaborador */}
              <div className="rounded-2xl border border-white/10 bg-white/3 p-4">
                <div className="mb-3 flex items-center gap-2 text-xs font-medium text-slate-300">
                  <SlidersHorizontal size={14} className="text-cyan-400" />
                  <span>Ajustes individuales para este recibo (opcional)</span>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div>
                    <label className="mb-1 block text-[10px] uppercase tracking-wider text-slate-400">
                      Estado de Bono Puntualidad
                    </label>
                    <select
                      value={
                        ajustesEmpleados[empleadoModal.empleado_id]?.forzarBono === true
                          ? 'forzar_si'
                          : ajustesEmpleados[empleadoModal.empleado_id]?.forzarBono === false
                            ? 'forzar_no'
                            : 'auto'
                      }
                      onChange={(e) => {
                        const val = e.target.value;
                        actualizarAjusteEmpleado(empleadoModal.empleado_id, {
                          forzarBono:
                            val === 'forzar_si' ? true : val === 'forzar_no' ? false : null,
                        });
                      }}
                      className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-xs text-white focus:border-cyan-400 focus:outline-none"
                    >
                      <option value="auto">
                        Automático ({empleadoModal.acreedor_bono ? 'Válido' : 'Inválido'})
                      </option>
                      <option value="forzar_si">Otorgar bono manualmente</option>
                      <option value="forzar_no">Retirar bono manualmente</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-[10px] uppercase tracking-wider text-slate-400">
                      Bono / Descuento extra ($ MXN)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Ej. 200 o -150"
                      value={ajustesEmpleados[empleadoModal.empleado_id]?.ajusteMonto ?? ''}
                      onChange={(e) =>
                        actualizarAjusteEmpleado(empleadoModal.empleado_id, {
                          ajusteMonto: e.target.value,
                        })
                      }
                      className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 font-mono text-xs text-white focus:border-cyan-400 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-[10px] uppercase tracking-wider text-slate-400">
                      Concepto / Nota
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. Día extra, préstamo..."
                      value={ajustesEmpleados[empleadoModal.empleado_id]?.nota ?? ''}
                      onChange={(e) =>
                        actualizarAjusteEmpleado(empleadoModal.empleado_id, {
                          nota: e.target.value,
                        })
                      }
                      className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-xs text-white focus:border-cyan-400 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Banner de Salario Neto del Empleado */}
              <div className="flex items-center justify-between rounded-2xl border border-emerald-400/25 bg-emerald-500/10 px-5 py-3.5">
                <div>
                  <span className="block text-[10px] font-semibold uppercase tracking-widest text-emerald-300">
                    Total Neto a Pagar
                  </span>
                  <span className="text-xs text-slate-300">
                    {formatCurrency(empleadoModal.salario_base)} (base) −{' '}
                    {formatCurrency(empleadoModal.descuento)} (faltas) +{' '}
                    {formatCurrency(empleadoModal.monto_bono)} (bono)
                    {empleadoModal.ajuste_manual !== 0
                      ? ` ${empleadoModal.ajuste_manual > 0 ? '+' : '-'} ${formatCurrency(
                          Math.abs(empleadoModal.ajuste_manual)
                        )} (ajuste)`
                      : ''}
                  </span>
                </div>
                <span className="font-mono text-2xl font-bold text-emerald-300">
                  {formatCurrency(empleadoModal.salario_neto)}
                </span>
              </div>

              {/* Bitácora diaria del período */}
              <div>
                <h3 className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Bitácora diaria evaluada ({empleadoModal.dias?.length || 0} días)
                </h3>
                <div className="space-y-2">
                  {empleadoModal.dias?.map((dia) => {
                    const condicionPrincipal = dia.condiciones?.[0];
                    const config = CONDICIONES[condicionPrincipal?.tipo] || CONDICIONES.futuro;
                    const esFalta = dia.condiciones?.some((c) => c.tipo === 'falta');
                    const evaluableBono = esDiaLaboralParaBono(dia);
                    const bonoDiaValido = Boolean(
                      evaluableBono &&
                        empleadoModal.aplica_bono !== false &&
                        dia.tiene_bono &&
                        !dia.condiciones?.some((c) =>
                          ['retardo', 'falta', 'permiso', 'vacaciones'].includes(c.tipo)
                        )
                    );

                    return (
                      <div
                        key={dia.fecha}
                        className="flex flex-col justify-between gap-2 rounded-xl border border-white/5 bg-black/20 px-3.5 py-2.5 sm:flex-row sm:items-center"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-11 shrink-0 rounded-xl border border-white/10 bg-white/4 py-1 text-center">
                            <strong className="block text-sm leading-none text-white">
                              {dia.dia_num}
                            </strong>
                            <span className="mt-0.5 block text-[10px] uppercase text-slate-400">
                              {dia.dia_semana?.slice(0, 3)}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {dia.condiciones?.map((item, idx) => {
                              const itemCfg = CONDICIONES[item.tipo] || config;
                              const ItemIcon = itemCfg.icon;
                              return (
                                <span
                                  key={`${item.tipo}-${idx}`}
                                  className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-0.5 text-xs font-medium ${itemCfg.color}`}
                                >
                                  {ItemIcon && <ItemIcon size={12} />}
                                  {item.label}
                                  {item.motivo ? ` (${item.motivo})` : ''}
                                </span>
                              );
                            })}
                            {evaluableBono && (
                              <span
                                className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-0.5 text-xs font-medium ${
                                  bonoDiaValido
                                    ? 'border-emerald-400/20 bg-emerald-500/10 text-emerald-300'
                                    : 'border-rose-400/20 bg-rose-500/10 text-rose-300'
                                }`}
                              >
                                <Award size={12} />
                                {bonoDiaValido ? 'Bono válido' : 'Bono inválido'}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-end gap-3 text-xs">
                          <span className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 font-mono text-slate-300">
                            {formatearHoraAmPm(dia.hora_entrada) || '--:--'} →{' '}
                            {formatearHoraAmPm(dia.hora_salida) || '--:--'}
                          </span>
                          {esFalta && (
                            <span className="rounded-lg border border-rose-400/20 bg-rose-500/10 px-2.5 py-1 font-mono text-xs font-semibold text-rose-300">
                              - {formatCurrency(empleadoModal.salario_diario)}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Footer del modal */}
            <div className="flex gap-3 border-t border-white/10 px-5 pb-5 pt-4 sm:px-7 sm:pb-6">
              <button
                type="button"
                onClick={() => setEmpleadoModalId(null)}
                className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 text-sm font-medium text-gray-300 transition hover:bg-white/10"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={() => imprimirReciboIndividual(empleadoModal)}
                disabled={imprimiendo}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-600 py-2.5 text-sm font-medium text-white shadow-lg shadow-cyan-950/30 transition hover:bg-cyan-500 disabled:opacity-50"
              >
                <Printer size={16} />
                <span>{imprimiendo ? 'Generando...' : 'Imprimir recibo de nómina'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

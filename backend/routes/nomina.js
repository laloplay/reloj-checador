const express = require('express');
const dayjs = require('dayjs');
const pool = require('../db/pool');
const authenticateAdmin = require('../middleware/auth');
const { construirDiasEmpleado, evaluarDiasParaBono } = require('../services/registros');

require('dayjs/locale/es');
dayjs.locale('es');

const router = express.Router();
router.use(authenticateAdmin);

const round2 = (num) => Math.round((Number(num) + Number.EPSILON) * 100) / 100;

function resolverPeriodo({ tipo = 'quincenal', fecha, fecha_inicio, fecha_fin }) {
  const base = fecha ? dayjs(String(fecha).slice(0, 10)) : dayjs();
  const baseValida = base.isValid() ? base : dayjs();

  let inicio;
  let fin;
  let etiqueta;
  let diasBasePago;

  switch (tipo) {
    case 'semanal': {
      const diaSemana = baseValida.day(); // 0 = Domingo, 1 = Lunes ... 6 = Sábado
      const offsetLunes = diaSemana === 0 ? -6 : 1 - diaSemana;
      inicio = baseValida.add(offsetLunes, 'day').startOf('day');
      fin = inicio.add(6, 'day').endOf('day');
      etiqueta = 'Semanal (7 días)';
      diasBasePago = 7;
      break;
    }
    case 'mensual': {
      inicio = baseValida.startOf('month').startOf('day');
      fin = baseValida.endOf('month').endOf('day');
      etiqueta = `Mensual (${baseValida.format('MMMM YYYY')})`;
      diasBasePago = 30;
      break;
    }
    case 'personalizado': {
      const iniCustom = fecha_inicio ? dayjs(String(fecha_inicio).slice(0, 10)) : baseValida.startOf('month');
      const finCustom = fecha_fin ? dayjs(String(fecha_fin).slice(0, 10)) : baseValida;
      inicio = (iniCustom.isValid() ? iniCustom : baseValida).startOf('day');
      fin = (finCustom.isValid() ? finCustom : baseValida).endOf('day');
      if (inicio.isAfter(fin)) {
        const temp = inicio;
        inicio = fin.startOf('day');
        fin = temp.endOf('day');
      }
      diasBasePago = fin.startOf('day').diff(inicio.startOf('day'), 'day') + 1;
      etiqueta = `Personalizado (${diasBasePago} ${diasBasePago === 1 ? 'día' : 'días'})`;
      break;
    }
    case 'quincenal':
    default: {
      if (baseValida.date() <= 15) {
        inicio = baseValida.startOf('month').startOf('day');
        fin = baseValida.date(15).endOf('day');
        etiqueta = `1ra Quincena de ${baseValida.format('MMMM YYYY')}`;
      } else {
        inicio = baseValida.date(16).startOf('day');
        fin = baseValida.endOf('month').endOf('day');
        etiqueta = `2da Quincena de ${baseValida.format('MMMM YYYY')}`;
      }
      diasBasePago = 15;
      break;
    }
  }

  const diasCalendario = fin.startOf('day').diff(inicio.startOf('day'), 'day') + 1;

  return {
    tipo,
    inicio,
    fin,
    inicioStr: inicio.format('YYYY-MM-DD'),
    finStr: fin.format('YYYY-MM-DD'),
    etiqueta,
    diasBasePago,
    diasCalendario,
  };
}

router.get('/calcular', async (req, res) => {
  const {
    tipo = 'quincenal',
    fecha,
    fecha_inicio,
    fecha_fin,
    sucursal_id,
    bono_modo = 'porcentaje',
    bono_valor = '10',
  } = req.query;

  const periodoInfo = resolverPeriodo({ tipo, fecha, fecha_inicio, fecha_fin });
  const valorBonoNum = Math.max(0, Number(bono_valor) || 0);

  try {
    const [empleadosRes, sinPuestoRes] = await Promise.all([
      pool.query(
        `SELECT
           e.id,
           e.nombre_completo,
           e.fecha_ingreso,
           e.fecha_nacimiento,
           e.dia_descanso,
           e.aplica_bono,
           e.sucursal_id,
           s.nombre AS sucursal_nombre,
           p.id AS puesto_id,
           p.nombre AS puesto_nombre,
           p.salario_base,
           t.id AS turno_id,
           t.nombre AS turno_nombre,
           t.hora_inicio AS turno_hora_inicio,
           t.hora_fin AS turno_hora_fin,
           t.minutos_bono AS turno_minutos_bono,
           t.bono_activo AS turno_bono_activo
         FROM empleados e
         JOIN puestos p ON e.puesto_id = p.id
         LEFT JOIN sucursales s ON e.sucursal_id = s.id
         LEFT JOIN turnos t ON e.turno_id = t.id
         WHERE e.activo = TRUE
           AND e.puesto_id IS NOT NULL
           AND ($1::uuid IS NULL OR e.sucursal_id = $1)
         ORDER BY s.nombre NULLS LAST, e.nombre_completo ASC`,
        [sucursal_id || null]
      ),
      pool.query(
        `SELECT e.id, e.nombre_completo, s.nombre AS sucursal_nombre
         FROM empleados e
         LEFT JOIN sucursales s ON e.sucursal_id = s.id
         WHERE e.activo = TRUE
           AND e.puesto_id IS NULL
           AND ($1::uuid IS NULL OR e.sucursal_id = $1)
         ORDER BY e.nombre_completo ASC`,
        [sucursal_id || null]
      ),
    ]);

    const nominaCalculada = await Promise.all(
      empleadosRes.rows.map(async (empleado) => {
        const calendario = await construirDiasEmpleado(
          empleado.id,
          empleado.dia_descanso,
          periodoInfo.inicio.toDate(),
          periodoInfo.fin.toDate(),
          pool
        );

        const fechaIngresoStr = empleado.fecha_ingreso
          ? dayjs(empleado.fecha_ingreso).format('YYYY-MM-DD')
          : null;

        let diasLaborables = 0;
        let diasTrabajados = 0;
        let diasPuntuales = 0;
        let retardos = 0;
        let faltas = 0;
        let diasDescanso = 0;
        let diasFestivos = 0;
        let diasVacaciones = 0;
        let diasPermiso = 0;
        let diasCumpleanos = 0;
        let diasJustificados = 0;
        let diasFuturos = 0;
        let diasExtraTrabajados = 0;
        let bonosDiarios = 0;

        const diasAjustados = (calendario.dias || []).map((dia) => {
          if (dia.es_futuro) {
            diasFuturos++;
            return dia;
          }

          // Si el día es anterior a la fecha de ingreso del colaborador, no cuenta como falta
          if (fechaIngresoStr && dia.fecha < fechaIngresoStr && !dia.hora_entrada) {
            return {
              ...dia,
              condiciones: [{ tipo: 'previo_ingreso', label: 'Previo a ingreso' }],
            };
          }

          const tipos = (dia.condiciones || []).map((c) => c.tipo);
          const tieneEntrada = Boolean(dia.hora_entrada);
          const tieneDescanso = tipos.includes('descanso');
          const tieneFestivo = tipos.includes('festivo');
          const tieneVacaciones = tipos.includes('vacaciones');
          const tienePermiso = tipos.includes('permiso');
          const tieneCumple = tipos.includes('cumpleanos');
          const esNoLaborableJustificado =
            tieneDescanso || tieneFestivo || tieneVacaciones || tienePermiso || tieneCumple;

          if (tieneDescanso) diasDescanso++;
          if (tieneFestivo) diasFestivos++;
          if (tieneVacaciones) diasVacaciones++;
          if (tienePermiso) diasPermiso++;
          if (tieneCumple) diasCumpleanos++;

          if (esNoLaborableJustificado) {
            diasJustificados++;
            if (tieneEntrada) {
              diasExtraTrabajados++;
            }
          } else {
            diasLaborables++;
          }

          if (tieneEntrada) {
            diasTrabajados++;
            if (dia.es_retardo || tipos.includes('retardo')) {
              retardos++;
            } else {
              diasPuntuales++;
            }
            if (dia.tiene_bono) {
              bonosDiarios++;
            }
          } else if (!esNoLaborableJustificado) {
            faltas++;
          }

          return dia;
        });

        // El salario_base en Puestos está expresado como Salario Quincenal (15 días)
        const salarioQuincenal = round2(parseFloat(empleado.salario_base) || 0);
        const salarioDiarioExacto = salarioQuincenal / 15;
        const salarioDiario = round2(salarioDiarioExacto);

        let salarioPeriodo;
        if (periodoInfo.tipo === 'quincenal') {
          salarioPeriodo = salarioQuincenal;
        } else if (periodoInfo.tipo === 'mensual') {
          salarioPeriodo = round2(salarioQuincenal * 2);
        } else {
          salarioPeriodo = round2(salarioDiarioExacto * periodoInfo.diasBasePago);
        }

        const descuento =
          faltas > 0 ? Math.min(salarioPeriodo, round2(faltas * salarioDiarioExacto)) : 0;

        const aplicaBonoConfig =
          empleado.aplica_bono !== false && empleado.turno_bono_activo !== false;

        const diasSinBono = Math.max(0, diasTrabajados - bonosDiarios);
        const evaluacionBono = evaluarDiasParaBono(diasAjustados, aplicaBonoConfig);
        const acreedorBono = evaluacionBono.valido;

        let motivoBono = 'Válido · Cumplió llegada con bono todos los días';
        if (!aplicaBonoConfig) {
          motivoBono = 'Inválido · Bono desactivado en empleado o turno';
        } else if (faltas > 0 && retardos > 0) {
          motivoBono = `Inválido · ${faltas} ${faltas === 1 ? 'falta' : 'faltas'} y ${retardos} ${retardos === 1 ? 'retardo' : 'retardos'}`;
        } else if (faltas > 0) {
          motivoBono = `Inválido · ${faltas} ${faltas === 1 ? 'falta registrada' : 'faltas registradas'}`;
        } else if (retardos > 0) {
          motivoBono = `Inválido · ${retardos} ${retardos === 1 ? 'retardo registrado' : 'retardos registrados'}`;
        } else if (diasSinBono > 0) {
          motivoBono = `Inválido · ${diasSinBono} ${
            diasSinBono === 1 ? 'día fuera' : 'días fuera'
          } del margen de bono (${empleado.turno_minutos_bono ?? 10} min antes)`;
        } else if (diasPermiso > 0 || diasVacaciones > 0) {
          motivoBono = 'Inválido · Permiso o vacaciones en el período';
        } else if (diasTrabajados === 0) {
          motivoBono = 'Inválido · Sin asistencias registradas en el período';
        }

        let montoBono = 0;
        if (acreedorBono) {
          if (bono_modo === 'porcentaje') {
            montoBono = round2(salarioPeriodo * (valorBonoNum / 100));
          } else if (bono_modo === 'fijo') {
            montoBono = round2(valorBonoNum);
          }
        }

        const salarioNeto = round2(Math.max(0, salarioPeriodo - descuento + montoBono));

        return {
          empleado_id: empleado.id,
          nombre_completo: empleado.nombre_completo,
          fecha_ingreso: empleado.fecha_ingreso,
          sucursal_id: empleado.sucursal_id,
          sucursal_nombre: empleado.sucursal_nombre || 'Sin sucursal',
          puesto_id: empleado.puesto_id,
          puesto: empleado.puesto_nombre,
          turno_nombre: empleado.turno_nombre || 'Sin turno',
          turno_hora_inicio: empleado.turno_hora_inicio,
          turno_hora_fin: empleado.turno_hora_fin,
          aplica_bono: aplicaBonoConfig,
          salario_quincenal: salarioQuincenal,
          salario_diario: salarioDiario,
          salario_base: salarioPeriodo,
          dias_base_pago: periodoInfo.diasBasePago,
          dias_calendario: periodoInfo.diasCalendario,
          dias_laborables: diasLaborables,
          dias_trabajados: diasTrabajados,
          dias_puntuales: diasPuntuales,
          retardos,
          faltas,
          dias_justificados: diasJustificados,
          dias_descanso: diasDescanso,
          dias_festivos: diasFestivos,
          dias_vacaciones: diasVacaciones,
          dias_permiso: diasPermiso,
          dias_cumpleanos: diasCumpleanos,
          dias_futuros: diasFuturos,
          dias_extra_trabajados: diasExtraTrabajados,
          bonos_diarios: bonosDiarios,
          acreedor_bono: acreedorBono,
          motivo_bono: motivoBono,
          monto_bono: montoBono,
          descuento,
          salario_neto: salarioNeto,
          dias: diasAjustados,
        };
      })
    );

    res.json({
      nomina: nominaCalculada,
      empleados_sin_puesto: sinPuestoRes.rows,
      periodo: {
        inicio: periodoInfo.inicioStr,
        fin: periodoInfo.finStr,
        tipo: periodoInfo.tipo,
        etiqueta: periodoInfo.etiqueta,
        dias_base_pago: periodoInfo.diasBasePago,
        dias_calendario: periodoInfo.diasCalendario,
      },
    });
  } catch (error) {
    console.error('GET /nomina/calcular error:', error);
    res.status(500).json({ message: 'Error interno al calcular la nómina' });
  }
});

module.exports = router;

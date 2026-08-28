const dayjs = require('dayjs');
const isBetween = require('dayjs/plugin/isBetween');

require('dayjs/locale/es');
dayjs.extend(isBetween);
dayjs.locale('es');

const calcularBonoQuincena = (diasQuincena) => {
  if (diasQuincena.some((dia) => dia.es_futuro)) {
    return null;
  }

  const diasEvaluables = diasQuincena.filter((dia) => {
    if (dia.es_futuro) return false;
    const esSoloDescansoOFestivo = dia.condiciones.every((condicion) =>
      ['descanso', 'festivo'].includes(condicion.tipo)
    ) && !dia.hora_entrada;
    return !esSoloDescansoOFestivo;
  });

  if (diasEvaluables.length === 0) {
    return null;
  }

  const invalidaBono = diasEvaluables.some((dia) =>
    dia.condiciones.some((condicion) =>
      ['retardo', 'falta', 'permiso', 'vacaciones'].includes(condicion.tipo)
    )
  );

  return !invalidaBono;
};

async function construirDiasEmpleado(empleadoId, diasDescanso, fechaInicio, fechaFin, pool) {
  const [empleadoRes, festivosRes, ausenciasRes, checadasRes] = await Promise.all([
    pool.query(
      'SELECT nombre_completo, fecha_nacimiento FROM empleados WHERE id = $1',
      [empleadoId]
    ),
    pool.query(
      'SELECT nombre, fecha, aplica_todos_los_años FROM dias_festivos WHERE activo = TRUE'
    ),
    pool.query(
      `SELECT tipo, fecha_inicio, fecha_fin, motivo
       FROM ausencias
       WHERE empleado_id = $1
         AND aprobado = TRUE
         AND fecha_fin >= $2
         AND fecha_inicio <= $3`,
      [empleadoId, fechaInicio.toISOString(), fechaFin.toISOString()]
    ),
    pool.query(
      `SELECT timestamp, tipo, es_retardo, tiene_bono
       FROM checadas
       WHERE empleado_id = $1
         AND timestamp BETWEEN $2 AND $3
       ORDER BY timestamp ASC`,
      [empleadoId, fechaInicio.toISOString(), fechaFin.toISOString()]
    ),
  ]);

  const empleado = empleadoRes.rows[0] || {};

  const festivosMap = new Map();
  for (const festivo of festivosRes.rows) {
    const clave = festivo.aplica_todos_los_años
      ? dayjs(festivo.fecha).format('MM-DD')
      : dayjs(festivo.fecha).format('YYYY-MM-DD');
    festivosMap.set(clave, festivo);
  }

  const checadasPorDia = new Map();
  for (const checada of checadasRes.rows) {
    const fecha = dayjs(checada.timestamp).format('YYYY-MM-DD');
    if (!checadasPorDia.has(fecha)) {
      checadasPorDia.set(fecha, { entradas: [], salidas: [] });
    }
    const checadas = checadasPorDia.get(fecha);
    if (checada.tipo === 'entrada') checadas.entradas.push(checada);
    else checadas.salidas.push(checada);
  }

  const dias = [];
  let totalEntradas = 0;
  let totalSalidas = 0;
  let totalRetardos = 0;
  let totalBonos = 0;
  let totalFaltas = 0;
  let diasLaborables = 0;
  const ahora = dayjs();
  const convertirFechaCalendario = (fecha) => {
    const fechaTexto = fecha instanceof Date
      ? fecha.toISOString().slice(0, 10)
      : String(fecha).slice(0, 10);
    return dayjs(fechaTexto).startOf('day');
  };
  const inicio = convertirFechaCalendario(fechaInicio);
  const fin = convertirFechaCalendario(fechaFin);

  for (let diaActual = inicio; !diaActual.isAfter(fin, 'day'); diaActual = diaActual.add(1, 'day')) {
    const fecha = diaActual.format('YYYY-MM-DD');
    const diaSemana = diaActual.day();
    const esFuturo = diaActual.isAfter(ahora, 'day');
    const diaData = {
      fecha,
      dia_semana: diaActual.format('dddd'),
      dia_num: diaActual.date(),
      es_futuro: esFuturo,
      hora_entrada: null,
      hora_salida: null,
      es_retardo: false,
      tiene_bono: false,
      condiciones: [],
      asistencia_en_dia_no_laborable: false,
    };

    if (esFuturo) {
      diaData.condiciones.push({ tipo: 'futuro', label: 'Futuro' });
      dias.push(diaData);
      continue;
    }

    const checadasDelDia = checadasPorDia.get(fecha);
    let tieneChecada = false;
    let esDiaNoLaborable = false;

    if (checadasDelDia?.entradas.length > 0) {
      tieneChecada = true;
      const primeraEntrada = checadasDelDia.entradas[0];
      diaData.hora_entrada = dayjs(primeraEntrada.timestamp).format('HH:mm');
      diaData.es_retardo = primeraEntrada.es_retardo;
      diaData.tiene_bono = primeraEntrada.tiene_bono;
      totalEntradas++;

      if (primeraEntrada.es_retardo) {
        diaData.condiciones.push({ tipo: 'retardo', label: 'Retardo' });
        totalRetardos++;
      } else {
        diaData.condiciones.push({ tipo: 'puntual', label: 'Puntual' });
      }
      if (primeraEntrada.tiene_bono) totalBonos++;

      if (checadasDelDia.salidas.length > 0) {
        const ultimaSalida = checadasDelDia.salidas[checadasDelDia.salidas.length - 1];
        diaData.hora_salida = dayjs(ultimaSalida.timestamp).format('HH:mm');
      }
    }

    totalSalidas += checadasDelDia?.salidas.length || 0;

    const ausenciasDelDia = ausenciasRes.rows.filter((ausencia) =>
      diaActual.isBetween(
        dayjs(ausencia.fecha_inicio).startOf('day'),
        dayjs(ausencia.fecha_fin).endOf('day'),
        null,
        '[]'
      )
    );
    if (ausenciasDelDia.length > 0) {
      ausenciasDelDia.forEach((ausencia) => {
        diaData.condiciones.push({
          tipo: ausencia.tipo,
          label: ausencia.tipo.charAt(0).toUpperCase() + ausencia.tipo.slice(1),
          motivo: ausencia.motivo,
        });
      });
      esDiaNoLaborable = true;
    }

    const festivo = festivosMap.get(fecha) || festivosMap.get(diaActual.format('MM-DD'));
    if (festivo) {
      diaData.condiciones.push({ tipo: 'festivo', label: 'Día Festivo', motivo: festivo.nombre });
      esDiaNoLaborable = true;
    }

    if ((diasDescanso || []).includes(diaSemana)) {
      diaData.condiciones.push({ tipo: 'descanso', label: 'Descanso' });
      esDiaNoLaborable = true;
    }

    const esCumpleanos = empleado.fecha_nacimiento
      && diaActual.format('MM-DD') === dayjs(empleado.fecha_nacimiento).format('MM-DD');
    if (esCumpleanos) {
      const edad = diaActual.year() - dayjs(empleado.fecha_nacimiento).year();
      const primerNombre = empleado.nombre_completo.split(' ')[0];
      diaData.condiciones.push({
        tipo: 'cumpleanos',
        label: '¡Felicidades!',
        motivo: `¡Feliz cumpleaños número ${edad}, ${primerNombre}!`,
      });
      esDiaNoLaborable = true;
    }

    if (!tieneChecada && !esDiaNoLaborable) {
      diaData.condiciones.push({ tipo: 'falta', label: 'Falta' });
      totalFaltas++;
      diasLaborables++;
    } else if (!esDiaNoLaborable) {
      diasLaborables++;
    }

    if (tieneChecada && esDiaNoLaborable) {
      diaData.asistencia_en_dia_no_laborable = true;
    }

    dias.push(diaData);
  }

  const diasPrimeraQuincena = dias.filter((dia) => dia.dia_num <= 15);
  const diasSegundaQuincena = dias.filter((dia) => dia.dia_num > 15);

  return {
    dias,
    estadisticas: {
      total_entradas: totalEntradas,
      total_salidas: totalSalidas,
      total_retardos: totalRetardos,
      total_bonos: totalBonos,
      total_faltas: totalFaltas,
      dias_laborables: diasLaborables,
    },
    bono_primera_quincena: calcularBonoQuincena(diasPrimeraQuincena),
    bono_segunda_quincena: calcularBonoQuincena(diasSegundaQuincena),
  };
}

module.exports = { construirDiasEmpleado };
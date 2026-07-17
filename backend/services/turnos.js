function parseHoraInicio(horaInicio, referenceDate = new Date()) {
  if (horaInicio instanceof Date) {
    return horaInicio;
  }

  if (typeof horaInicio !== 'string') {
    throw new Error('hora_inicio debe ser una cadena de texto');
  }

  const partes = horaInicio.split(':').map((value) => parseInt(value, 10));
  if (partes.length < 2 || partes.length > 3 || partes.some(Number.isNaN)) {
    throw new Error('hora_inicio no tiene un formato válido');
  }

  const [hora, minuto, segundo = 0] = partes;
  const fecha = new Date(referenceDate);
  fecha.setHours(hora, minuto, segundo, 0);
  return fecha;
}

function normalizeTimestamp(value) {
  if (value instanceof Date) {
    return value;
  }

  if (typeof value === 'string' || typeof value === 'number') {
    const fecha = new Date(value);
    if (Number.isNaN(fecha.getTime())) {
      throw new Error('timestampActual inválido');
    }
    return fecha;
  }

  throw new Error('timestampActual debe ser una fecha, marca de tiempo o cadena ISO');
}

function calcularChecada(turno, timestampActual = new Date()) {
  if (!turno || !turno.hora_inicio) {
    throw new Error('turno debe incluir hora_inicio');
  }

  const ahora = normalizeTimestamp(timestampActual);
  const inicioTurno = parseHoraInicio(turno.hora_inicio, ahora);
  const diferenciaSegundos = Math.floor((ahora.getTime() - inicioTurno.getTime()) / 1000);

  const tiene_bono = diferenciaSegundos <= -(turno.minutos_bono * 60);
  const es_retardo = diferenciaSegundos > 0;
  const minutos_diferencia = Math.round(Math.abs(diferenciaSegundos) / 60);

  return {
    tiene_bono,
    es_retardo,
    minutos_diferencia,
  };
}

module.exports = {
  calcularChecada,
};

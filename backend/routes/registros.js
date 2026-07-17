const express = require('express');
const pool = require('../db/pool');
const authenticateAdmin = require('../middleware/auth');

const router = express.Router();
router.use(authenticateAdmin);

const parseDateTime = (value, isEndOfDay = false) => {
  if (!value) {
    return null;
  }

  const suffix = isEndOfDay ? '23:59:59.999' : '00:00:00';
  return new Date(`${value}T${suffix}`);
};

const getDefaultRange = () => {
  const hoy = new Date();
  const inicio = new Date(Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth(), 1));
  const fin = new Date(hoy);
  fin.setUTCHours(23, 59, 59, 999);
  return {
    inicio,
    fin,
  };
};

const buildRange = (fechaInicio, fechaFin) => {
  const defaults = getDefaultRange();
  const inicio = fechaInicio ? parseDateTime(fechaInicio, false) : defaults.inicio;
  const fin = fechaFin ? parseDateTime(fechaFin, true) : defaults.fin;

  return { inicio, fin };
};

router.get('/', async (req, res) => {
  const { sucursal_id, empleado_id, fecha_inicio, fecha_fin } = req.query;
  const { inicio, fin } = buildRange(fecha_inicio, fecha_fin);

  if (inicio > fin) {
    return res.status(400).json({ message: 'fecha_inicio no puede ser mayor que fecha_fin' });
  }

  try {
    const { rows } = await pool.query(
      `SELECT
        c.id,
        c.empleado_id,
        c.dispositivo_id,
        c.tipo,
        c.timestamp,
        c.turno_id,
        c.tiene_bono,
        c.es_retardo,
        c.minutos_diferencia,
        c.confianza_facial,
        c.created_at,
        COALESCE(c.sucursal_id, e.sucursal_id, t.sucursal_id) AS sucursal_id,
        e.nombre_completo AS empleado_nombre_completo,
        e.activo AS empleado_activo,
        e.aplica_bono AS empleado_aplica_bono,
        p.nombre AS puesto_nombre,
        p.salario_base AS puesto_salario_base,
        t.nombre AS turno_nombre,
        t.hora_inicio AS turno_hora_inicio,
        t.hora_fin AS turno_hora_fin,
        t.duracion_horas AS turno_duracion_horas,
        t.minutos_bono AS turno_minutos_bono,
        t.bono_activo AS turno_bono_activo,
        s.nombre AS sucursal_nombre,
        s.direccion AS sucursal_direccion
       FROM checadas c
       JOIN empleados e ON e.id = c.empleado_id
       LEFT JOIN puestos p ON p.id = e.puesto_id
       LEFT JOIN turnos t ON t.id = COALESCE(c.turno_id, e.turno_id)
       LEFT JOIN sucursales s ON s.id = COALESCE(c.sucursal_id, e.sucursal_id, t.sucursal_id)
       WHERE ($1::uuid IS NULL OR COALESCE(c.sucursal_id, e.sucursal_id, t.sucursal_id) = $1)
         AND ($2::uuid IS NULL OR c.empleado_id = $2)
         AND c.timestamp >= $3::timestamptz
         AND c.timestamp <= $4::timestamptz
       ORDER BY c.timestamp DESC`,
      [sucursal_id || null, empleado_id || null, inicio, fin]
    );

    res.json(rows);
  } catch (error) {
    console.error('GET /registros error:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

router.get('/estadisticas/:empleado_id', async (req, res) => {
  const { empleado_id } = req.params;
  const { fecha_inicio, fecha_fin } = req.query;
  const { inicio, fin } = buildRange(fecha_inicio, fecha_fin);

  if (inicio > fin) {
    return res.status(400).json({ message: 'fecha_inicio no puede ser mayor que fecha_fin' });
  }

  try {
    const { rows } = await pool.query(
      `WITH dias_laborables AS (
         SELECT COUNT(*)::int AS total
         FROM generate_series(
           date_trunc('day', $2::timestamptz),
           date_trunc('day', $3::timestamptz),
           interval '1 day'
         ) AS dia
         WHERE EXTRACT(DOW FROM dia) <> 0
       ),
       checadas_periodo AS (
         SELECT
           COALESCE(COUNT(*) FILTER (WHERE tipo = 'entrada'), 0)::int AS total_entradas,
           COALESCE(COUNT(*) FILTER (WHERE tipo = 'salida'), 0)::int AS total_salidas,
           COALESCE(COUNT(*) FILTER (WHERE es_retardo), 0)::int AS total_retardos,
           COALESCE(COUNT(*) FILTER (WHERE tiene_bono), 0)::int AS total_bonos,
           COALESCE(COUNT(DISTINCT DATE(timestamp)) FILTER (WHERE tipo = 'entrada'), 0)::int AS dias_con_entrada
         FROM checadas
         WHERE empleado_id = $1
           AND timestamp >= $2::timestamptz
           AND timestamp <= $3::timestamptz
       )
       SELECT
         COALESCE(checadas_periodo.total_entradas, 0)::int AS total_entradas,
         COALESCE(checadas_periodo.total_salidas, 0)::int AS total_salidas,
         COALESCE(checadas_periodo.total_retardos, 0)::int AS total_retardos,
         COALESCE(checadas_periodo.total_bonos, 0)::int AS total_bonos,
         GREATEST(
           COALESCE(dias_laborables.total, 0) - COALESCE(checadas_periodo.dias_con_entrada, 0),
           0
         )::int AS total_faltas,
         COALESCE(dias_laborables.total, 0)::int AS dias_laborables
       FROM dias_laborables
       CROSS JOIN checadas_periodo`,
      [empleado_id, inicio, fin]
    );

    res.json({
      empleado_id,
      periodo: {
        inicio: inicio.toISOString().split('T')[0],
        fin: fin.toISOString().split('T')[0],
      },
      total_entradas: rows[0]?.total_entradas || 0,
      total_salidas: rows[0]?.total_salidas || 0,
      total_retardos: rows[0]?.total_retardos || 0,
      total_bonos: rows[0]?.total_bonos || 0,
      total_faltas: rows[0]?.total_faltas || 0,
      dias_laborables: rows[0]?.dias_laborables || 0,
    });
  } catch (error) {
    console.error('GET /registros/estadisticas/:empleado_id error:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

module.exports = router;
const express = require('express');
const pool = require('../db/pool');
const authenticateAdmin = require('../middleware/auth');

const router = express.Router();
router.use(authenticateAdmin);

router.get('/dia', async (req, res) => {
  const { sucursal_id } = req.query;
  const fecha = req.query.fecha ? new Date(req.query.fecha) : new Date();

  try {
    const { rows } = await pool.query(
      `SELECT
        COALESCE(count(*), 0)::int AS total_checadas,
        COALESCE(sum(CASE WHEN tipo = 'entrada' THEN 1 ELSE 0 END), 0)::int AS entradas,
        COALESCE(sum(CASE WHEN tipo = 'salida' THEN 1 ELSE 0 END), 0)::int AS salidas
       FROM checadas
       WHERE timestamp >= date_trunc('day', $1::timestamp)
         AND timestamp < date_trunc('day', $1::timestamp) + interval '1 day'
         AND ($2::uuid IS NULL OR sucursal_id = $2)`,
      [fecha.toISOString(), sucursal_id || null]
    );
    res.json({ dia: fecha.toISOString(), ...rows[0] });
  } catch (error) {
    console.error('GET reportes/dia error:', error);
    res.status(500).json({ message: 'Error interno' });
  }
});

router.get('/semana', async (req, res) => {
  const { sucursal_id } = req.query;
  const fecha = req.query.fecha ? new Date(req.query.fecha) : new Date();

  try {
    const { rows } = await pool.query(
      `SELECT
        COALESCE(count(*), 0)::int AS total_checadas,
        COALESCE(sum(CASE WHEN tipo = 'entrada' THEN 1 ELSE 0 END), 0)::int AS entradas,
        COALESCE(sum(CASE WHEN tipo = 'salida' THEN 1 ELSE 0 END), 0)::int AS salidas
       FROM checadas
       WHERE timestamp >= date_trunc('week', $1::timestamp)
         AND timestamp < date_trunc('week', $1::timestamp) + interval '7 day'
         AND ($2::uuid IS NULL OR sucursal_id = $2)`,
      [fecha.toISOString(), sucursal_id || null]
    );
    res.json({ semana: fecha.toISOString(), ...rows[0] });
  } catch (error) {
    console.error('GET reportes/semana error:', error);
    res.status(500).json({ message: 'Error interno' });
  }
});

router.get('/empleado/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const { rows } = await pool.query(
      'SELECT * FROM checadas WHERE empleado_id = $1 ORDER BY timestamp DESC',
      [id]
    );
    res.json(rows);
  } catch (error) {
    console.error('GET reportes/empleado/:id error:', error);
    res.status(500).json({ message: 'Error interno' });
  }
});

router.get('/semana-detalle', async (req, res) => {
  const { sucursal_id } = req.query;
  try {
    const { rows } = await pool.query(
      `
      WITH week_days AS (
        SELECT generate_series(
          date_trunc('week', NOW()),
          date_trunc('week', NOW()) + interval '6 days',
          '1 day'
        )::date AS dia_fecha
      )
      SELECT
        d.dia_fecha,
        COALESCE(c.total, 0)::int AS total,
        COALESCE(c.entradas, 0)::int AS entradas,
        COALESCE(c.salidas, 0)::int AS salidas,
        COALESCE(c.retardos, 0)::int AS retardos
      FROM week_days d
      LEFT JOIN (
        SELECT
          date_trunc('day', timestamp)::date AS dia_fecha,
          count(*) AS total,
          sum(CASE WHEN tipo = 'entrada' THEN 1 ELSE 0 END) AS entradas,
          sum(CASE WHEN tipo = 'salida' THEN 1 ELSE 0 END) AS salidas,
          sum(CASE WHEN es_retardo THEN 1 ELSE 0 END) AS retardos
        FROM checadas
        WHERE timestamp >= date_trunc('week', NOW()) AND timestamp < date_trunc('week', NOW()) + interval '7 days' AND ($1::uuid IS NULL OR sucursal_id = $1)
        GROUP BY 1
      ) c ON d.dia_fecha = c.dia_fecha
      ORDER BY d.dia_fecha ASC`, [sucursal_id || null]
    );
    res.json(rows);
  } catch (error) {
    console.error('GET reportes/semana-detalle error:', error);
    res.status(500).json({ message: 'Error interno' });
  }
});

module.exports = router;

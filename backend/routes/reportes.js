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

module.exports = router;

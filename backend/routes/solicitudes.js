const express = require('express');
const pool = require('../db/pool');
const authenticateAdmin = require('../middleware/auth');

const router = express.Router();

router.post('/', async (req, res) => {
  const { empleado_id, mensaje } = req.body;

  if (!mensaje) {
    return res.status(400).json({ message: 'El mensaje es obligatorio' });
  }

  try {
    const { rows } = await pool.query(
      'INSERT INTO solicitudes_correccion (empleado_id, mensaje) VALUES ($1, $2) RETURNING *',
      [empleado_id || null, mensaje]
    );

    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('POST solicitudes-correccion error:', error);
    res.status(500).json({ message: 'Error interno' });
  }
});

router.use(authenticateAdmin);

router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT sc.*, e.nombre_completo AS empleado_nombre_completo, s.nombre AS sucursal_nombre
       FROM solicitudes_correccion sc
       LEFT JOIN empleados e ON e.id = sc.empleado_id
       LEFT JOIN sucursales s ON s.id = e.sucursal_id
       ORDER BY sc.leida ASC, sc.created_at DESC`
    );

    res.json(rows);
  } catch (error) {
    console.error('GET solicitudes-correccion error:', error);
    res.status(500).json({ message: 'Error interno' });
  }
});

module.exports = router;
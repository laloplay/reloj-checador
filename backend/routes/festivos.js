const express = require('express');
const pool = require('../db/pool');
const authenticateAdmin = require('../middleware/auth');

const router = express.Router();
router.use(authenticateAdmin);

router.get('/', async (req, res) => {
  const { activo } = req.query;

  try {
    const params = [];
    const conditions = [];

    if (activo === 'true' || activo === 'false') {
      params.push(activo === 'true');
      conditions.push(`activo = $${params.length}`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const { rows } = await pool.query(
      `SELECT * FROM dias_festivos ${whereClause} ORDER BY fecha ASC, nombre ASC`,
      params
    );

    res.json(rows);
  } catch (error) {
    console.error('GET festivos error:', error);
    res.status(500).json({ message: 'Error interno' });
  }
});

router.post('/', async (req, res) => {
  const { nombre, fecha, aplica_todos_los_años, activo } = req.body;

  if (!nombre || !fecha) {
    return res.status(400).json({ message: 'El nombre y la fecha son obligatorios' });
  }

  try {
    const { rows } = await pool.query(
      'INSERT INTO dias_festivos (nombre, fecha, aplica_todos_los_años, activo) VALUES ($1, $2, $3, $4) RETURNING *',
      [nombre, fecha, aplica_todos_los_años !== false, activo !== false]
    );

    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('POST festivos error:', error);
    res.status(500).json({ message: 'Error interno' });
  }
});

router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { nombre, fecha, aplica_todos_los_años, activo } = req.body;

  if (!nombre || !fecha) {
    return res.status(400).json({ message: 'El nombre y la fecha son obligatorios' });
  }

  try {
    const { rows } = await pool.query(
      'UPDATE dias_festivos SET nombre = $1, fecha = $2, aplica_todos_los_años = $3, activo = $4 WHERE id = $5 RETURNING *',
      [nombre, fecha, aplica_todos_los_años, activo, id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Día festivo no encontrado' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('PUT festivos error:', error);
    res.status(500).json({ message: 'Error interno' });
  }
});

router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const { rows } = await pool.query(
      'UPDATE dias_festivos SET activo = false WHERE id = $1 RETURNING *',
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Día festivo no encontrado' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('DELETE festivos error:', error);
    res.status(500).json({ message: 'Error interno' });
  }
});

module.exports = router;
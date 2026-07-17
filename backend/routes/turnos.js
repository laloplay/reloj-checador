const express = require('express');
const pool = require('../db/pool');
const authenticateAdmin = require('../middleware/auth');

const router = express.Router();
router.use(authenticateAdmin);

router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM turnos ORDER BY created_at DESC');
    res.json(rows);
  } catch (error) {
    console.error('GET turnos error:', error);
    res.status(500).json({ message: 'Error interno' });
  }
});

router.post('/', async (req, res) => {
  const { nombre, hora_inicio, hora_fin, minutos_bono, activo, sucursal_id, bono_activo } = req.body;
  if (!nombre || !hora_inicio || !hora_fin) {
    return res.status(400).json({ message: 'nombre, hora_inicio y hora_fin son obligatorios' });
  }

  const [h1, m1] = hora_inicio.split(':').map(Number);
  const [h2, m2] = hora_fin.split(':').map(Number);
  let duracion_horas = (h2 * 60 + m2 - (h1 * 60 + m1)) / 60;
  if (duracion_horas < 0) duracion_horas += 24;

  try {
    const { rows } = await pool.query(
      'INSERT INTO turnos (nombre, hora_inicio, hora_fin, duracion_horas, minutos_bono, activo, sucursal_id, bono_activo) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [nombre, hora_inicio, hora_fin, duracion_horas, minutos_bono || 10, activo !== false, sucursal_id || null, bono_activo !== false]
    );
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('POST turnos error:', error);
    res.status(500).json({ message: 'Error interno' });
  }
});

router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { nombre, hora_inicio, hora_fin, minutos_bono, activo, sucursal_id, bono_activo } = req.body;

  const [h1, m1] = hora_inicio.split(':').map(Number);
  const [h2, m2] = hora_fin.split(':').map(Number);
  let duracion_horas = (h2 * 60 + m2 - (h1 * 60 + m1)) / 60;
  if (duracion_horas < 0) duracion_horas += 24;

  try {
    const { rows } = await pool.query(
      'UPDATE turnos SET nombre = $1, hora_inicio = $2, hora_fin = $3, duracion_horas = $4, minutos_bono = $5, activo = $6, sucursal_id = $7, bono_activo = $8 WHERE id = $9 RETURNING *',
      [nombre, hora_inicio, hora_fin, duracion_horas, minutos_bono, activo, sucursal_id || null, bono_activo, id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Turno no encontrado' });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error('PUT turnos error:', error);
    res.status(500).json({ message: 'Error interno' });
  }
});

router.delete('/:id', authenticateAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const { rows } = await pool.query(
      'UPDATE turnos SET activo = false WHERE id = $1 RETURNING *',
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Turno no encontrado' });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error('DELETE turnos error:', error);
    res.status(500).json({ message: 'Error interno' });
  }
});

module.exports = router;

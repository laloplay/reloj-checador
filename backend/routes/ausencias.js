const express = require('express');
const pool = require('../db/pool');
const authenticateAdmin = require('../middleware/auth');

const router = express.Router();
router.use(authenticateAdmin);

const TIPOS_VALIDOS = ['vacaciones', 'permiso', 'descanso'];

router.get('/', async (req, res) => {
  const { empleado_id } = req.query;

  try {
    const params = [];
    const filters = [];

    if (empleado_id) {
      params.push(empleado_id);
      filters.push(`a.empleado_id = $${params.length}`);
    }

    const whereClause = filters.length > 0 ? `WHERE ${filters.join(' AND ')}` : '';

    const { rows } = await pool.query(
      `SELECT
        a.*,
        e.nombre_completo AS empleado_nombre_completo,
        e.dia_descanso,
        e.activo AS empleado_activo,
        t.nombre AS turno_nombre,
        s.nombre AS sucursal_nombre
       FROM ausencias a
       LEFT JOIN empleados e ON e.id = a.empleado_id
       LEFT JOIN turnos t ON t.id = e.turno_id
       LEFT JOIN sucursales s ON s.id = e.sucursal_id
       ${whereClause}
       ORDER BY a.fecha_inicio DESC, a.created_at DESC`,
      params
    );

    res.json(rows);
  } catch (error) {
    console.error('GET ausencias error:', error);
    res.status(500).json({ message: 'Error interno' });
  }
});

router.post('/', async (req, res) => {
  const { empleado_id, tipo, fecha_inicio, fecha_fin, motivo, aprobado } = req.body;

  if (!empleado_id || !tipo || !fecha_inicio || !fecha_fin) {
    return res.status(400).json({ message: 'empleado_id, tipo, fecha_inicio y fecha_fin son obligatorios' });
  }

  if (!TIPOS_VALIDOS.includes(tipo)) {
    return res.status(400).json({ message: 'tipo inválido' });
  }

  if (new Date(fecha_inicio) > new Date(fecha_fin)) {
    return res.status(400).json({ message: 'fecha_inicio no puede ser mayor que fecha_fin' });
  }

  try {
    const { rows } = await pool.query(
      'INSERT INTO ausencias (empleado_id, tipo, fecha_inicio, fecha_fin, motivo, aprobado) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [empleado_id, tipo, fecha_inicio, fecha_fin, motivo || null, aprobado === true]
    );

    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('POST ausencias error:', error);
    res.status(500).json({ message: 'Error interno' });
  }
});

router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { empleado_id, tipo, fecha_inicio, fecha_fin, motivo, aprobado } = req.body;

  if (!empleado_id || !tipo || !fecha_inicio || !fecha_fin) {
    return res.status(400).json({ message: 'empleado_id, tipo, fecha_inicio y fecha_fin son obligatorios' });
  }

  if (!TIPOS_VALIDOS.includes(tipo)) {
    return res.status(400).json({ message: 'tipo inválido' });
  }

  if (new Date(fecha_inicio) > new Date(fecha_fin)) {
    return res.status(400).json({ message: 'fecha_inicio no puede ser mayor que fecha_fin' });
  }

  try {
    const { rows } = await pool.query(
      'UPDATE ausencias SET empleado_id = $1, tipo = $2, fecha_inicio = $3, fecha_fin = $4, motivo = $5, aprobado = $6 WHERE id = $7 RETURNING *',
      [empleado_id, tipo, fecha_inicio, fecha_fin, motivo || null, aprobado === true, id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Ausencia no encontrada' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('PUT ausencias error:', error);
    res.status(500).json({ message: 'Error interno' });
  }
});

router.put('/:id/aprobar', async (req, res) => {
  const { id } = req.params;
  const { aprobado = true } = req.body;

  try {
    const { rows } = await pool.query(
      'UPDATE ausencias SET aprobado = $1 WHERE id = $2 RETURNING *',
      [aprobado, id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Ausencia no encontrada' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('PUT ausencias/:id/aprobar error:', error);
    res.status(500).json({ message: 'Error interno' });
  }
});

router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const { rows } = await pool.query('DELETE FROM ausencias WHERE id = $1 RETURNING *', [id]);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Ausencia no encontrada' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('DELETE ausencias error:', error);
    res.status(500).json({ message: 'Error interno' });
  }
});

module.exports = router;
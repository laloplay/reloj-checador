const express = require('express');
const pool = require('../db/pool');
const authenticateAdmin = require('../middleware/auth');
const router = express.Router();
router.use(authenticateAdmin);

router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM sucursales ORDER BY nombre ASC');
    res.json(rows);
  } catch (error) {
    console.error('GET sucursales error:', error);
    res.status(500).json({ message: 'Error interno' });
  }
});

router.post('/', async (req, res) => {
  const { nombre, direccion } = req.body;
  if (!nombre) {
    return res.status(400).json({ message: 'El nombre es obligatorio' });
  }
  try {
    const { rows } = await pool.query(
      'INSERT INTO sucursales (nombre, direccion) VALUES ($1, $2) RETURNING *',
      [nombre, direccion]
    );
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('POST sucursales error:', error);
    res.status(500).json({ message: 'Error interno' });
  }
});

router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { nombre, direccion, activo } = req.body;
  if (!nombre) {
    return res.status(400).json({ message: 'El nombre es obligatorio' });
  }
  try {
    const { rows } = await pool.query(
      'UPDATE sucursales SET nombre = $1, direccion = $2, activo = $3 WHERE id = $4 RETURNING *',
      [nombre, direccion, activo, id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Sucursal no encontrada' });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error('PUT sucursales error:', error);
    res.status(500).json({ message: 'Error interno' });
  }
});

router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const { rows } = await pool.query(
      'UPDATE sucursales SET activo = false WHERE id = $1 RETURNING *',
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Sucursal no encontrada' });
    }
    res.status(200).json(rows[0]);
  } catch (error) {
    console.error('DELETE sucursales error:', error);
    res.status(500).json({ message: 'Error interno' });
  }
});

module.exports = router;
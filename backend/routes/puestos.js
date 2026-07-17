const express = require('express');
const pool = require('../db/pool');
const authenticateAdmin = require('../middleware/auth');

const router = express.Router();
router.use(authenticateAdmin);

// GET / -> trae todos los puestos ordenados por nombre
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM puestos ORDER BY nombre ASC');
    res.json(rows);
  } catch (error) {
    console.error('GET puestos error:', error);
    res.status(500).json({ message: 'Error interno' });
  }
});

// POST / -> crea nuevo puesto, valida que nombre y salario_base sean obligatorios
router.post('/', async (req, res) => {
  const { nombre, descripcion, salario_base } = req.body;
  if (!nombre || salario_base == null) {
    return res.status(400).json({ message: 'El nombre y el salario base son obligatorios' });
  }
  try {
    const { rows } = await pool.query(
      'INSERT INTO puestos (nombre, descripcion, salario_base) VALUES ($1, $2, $3) RETURNING *',
      [nombre, descripcion, salario_base]
    );
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('POST puestos error:', error);
    res.status(500).json({ message: 'Error interno' });
  }
});

// PUT /:id -> edita nombre, descripcion, salario_base, activo
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { nombre, descripcion, salario_base, activo } = req.body;
  if (!nombre || salario_base == null) {
    return res.status(400).json({ message: 'El nombre y el salario base son obligatorios' });
  }
  try {
    const { rows } = await pool.query(
      'UPDATE puestos SET nombre = $1, descripcion = $2, salario_base = $3, activo = $4 WHERE id = $5 RETURNING *',
      [nombre, descripcion, salario_base, activo, id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Puesto no encontrado' });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error('PUT puestos error:', error);
    res.status(500).json({ message: 'Error interno' });
  }
});

// DELETE /:id -> soft delete, UPDATE activo = false
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const { rows } = await pool.query(
      'UPDATE puestos SET activo = false WHERE id = $1 RETURNING *',
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Puesto no encontrado' });
    }
    res.status(200).json(rows[0]);
  } catch (error) {
    console.error('DELETE puestos error:', error);
    res.status(500).json({ message: 'Error interno' });
  }
});

module.exports = router;
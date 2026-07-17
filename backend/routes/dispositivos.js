const express = require('express');
const { v4: uuidv4 } = require('uuid');
const pool = require('../db/pool');
const authenticateAdmin = require('../middleware/auth');

const router = express.Router();

router.post('/registrar', async (req, res) => {
  const { fingerprint, nombre, ip, navegador, token } = req.body;
  if (!fingerprint) {
    return res.status(400).json({ message: 'fingerprint es obligatorio' });
  }

  try {
    const deviceToken = token || uuidv4();
    const { rows } = await pool.query(
  `INSERT INTO dispositivos (fingerprint, token, nombre, ip, navegador) 
   VALUES ($1, $2, $3, $4, $5)
   ON CONFLICT (fingerprint) DO UPDATE SET
     ultimo_acceso = NOW()
   RETURNING *`,
  [fingerprint, deviceToken, nombre, ip, navegador]
);
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('POST dispositivos registrar error:', error);
    res.status(500).json({ message: 'Error interno' });
  }
});

router.get('/', authenticateAdmin, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM dispositivos ORDER BY created_at DESC');
    res.json(rows);
  } catch (error) {
    console.error('GET dispositivos error:', error);
    res.status(500).json({ message: 'Error interno' });
  }
});

router.get('/verificar', async (req, res) => {
  const deviceToken = req.headers['device-token']
  if (!deviceToken) return res.status(403).json({ message: 'Sin token' })
  const { rows } = await pool.query(
    'SELECT estado FROM dispositivos WHERE token = $1',
    [deviceToken]
  )
  if (rows.length === 0) return res.status(404).json({ message: 'No encontrado' })
  res.json({ estado: rows[0].estado })
});

router.put('/:id/aprobar', authenticateAdmin, async (req, res) => {
  const { id } = req.params;
  const { sucursal_id } = req.body;

  try {
    const { rows } = await pool.query(
      'UPDATE dispositivos SET estado = $1, aprobado_por = $2, aprobado_en = NOW(), sucursal_id = $3 WHERE id = $4 RETURNING *',
      ['aprobado', req.user.id, sucursal_id, id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Dispositivo no encontrado' });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error('PUT dispositivos aprobar error:', error);
    res.status(500).json({ message: 'Error interno' });
  }
});

router.put('/:id/rechazar', authenticateAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    const { rows } = await pool.query(
      'UPDATE dispositivos SET estado = $1, aprobado_por = $2, aprobado_en = NOW() WHERE id = $3 RETURNING *',
      ['rechazado', req.user.id, id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Dispositivo no encontrado' });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error('PUT dispositivos rechazar error:', error);
    res.status(500).json({ message: 'Error interno' });
  }
});

module.exports = router;

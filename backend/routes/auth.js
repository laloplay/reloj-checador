const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db/pool');

const router = express.Router();

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: 'username and password are required' });
  }

  try {
    await pool.query(`
      ALTER TABLE admins ADD COLUMN IF NOT EXISTS nombre_completo VARCHAR(200);
      ALTER TABLE admins ADD COLUMN IF NOT EXISTS activo BOOLEAN DEFAULT TRUE;
      ALTER TABLE admins ADD COLUMN IF NOT EXISTS ultimo_acceso TIMESTAMPTZ;
    `).catch(() => {});

    const { rows } = await pool.query(
      'SELECT id, username, password_hash, COALESCE(activo, TRUE) AS activo FROM admins WHERE LOWER(username) = LOWER($1)',
      [username]
    );
    if (rows.length === 0) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    const admin = rows[0];
    if (admin.activo === false) {
      return res.status(403).json({ message: 'Usuario inactivo' });
    }

    const passwordMatch = await bcrypt.compare(password, admin.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    await pool.query(
      'UPDATE admins SET ultimo_acceso = NOW() WHERE id = $1',
      [admin.id]
    );

    const token = jwt.sign(
      { id: admin.id, username: admin.username },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '8h' }
    );

    res.json({ token });
  } catch (error) {
    console.error('Auth login error:', error);
    res.status(500).json({ message: 'Error interno' });
  }
});

module.exports = router;

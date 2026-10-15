const express = require('express');
const bcrypt = require('bcryptjs');
const pool = require('../db/pool');
const authenticateAdmin = require('../middleware/auth');

const router = express.Router();
router.use(authenticateAdmin);

let schemaReady = false;
async function ensureAdminsColumns() {
  if (schemaReady) return;
  try {
    await pool.query(`
      ALTER TABLE admins ADD COLUMN IF NOT EXISTS nombre_completo VARCHAR(200);
      ALTER TABLE admins ADD COLUMN IF NOT EXISTS activo BOOLEAN DEFAULT TRUE;
      ALTER TABLE admins ADD COLUMN IF NOT EXISTS ultimo_acceso TIMESTAMPTZ;
    `);
    schemaReady = true;
  } catch (error) {
    console.error('Error asegurando columnas de admins:', error);
  }
}

// GET / -> Lista todos los admins (nunca regresa password_hash)
router.get('/', async (req, res) => {
  try {
    await ensureAdminsColumns();
    const { rows } = await pool.query(
      `SELECT id, username, nombre_completo, COALESCE(activo, TRUE) AS activo, ultimo_acceso, created_at
       FROM admins
       ORDER BY created_at ASC`
    );
    res.json(rows);
  } catch (error) {
    console.error('GET /usuarios error:', error);
    res.status(500).json({ message: 'Error interno al obtener usuarios' });
  }
});

// POST / -> Crea nuevo admin
router.post('/', async (req, res) => {
  const { username, password, nombre_completo } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'El usuario y la contraseña son obligatorios' });
  }

  const cleanUsername = String(username).trim();
  if (/\s/.test(cleanUsername)) {
    return res.status(400).json({ message: 'El nombre de usuario no puede contener espacios' });
  }

  try {
    await ensureAdminsColumns();

    const existing = await pool.query(
      'SELECT id FROM admins WHERE LOWER(username) = LOWER($1)',
      [cleanUsername]
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({ message: 'El nombre de usuario ya está en uso' });
    }

    const password_hash = await bcrypt.hash(password, 10);

    const { rows } = await pool.query(
      `INSERT INTO admins (username, password_hash, nombre_completo, activo)
       VALUES ($1, $2, $3, TRUE)
       RETURNING id, username, nombre_completo, activo, ultimo_acceso, created_at`,
      [cleanUsername, password_hash, nombre_completo?.trim() || null]
    );

    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('POST /usuarios error:', error);
    res.status(500).json({ message: 'Error interno al crear el usuario' });
  }
});

// PUT /:id -> Edita un admin
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { username, nombre_completo, activo, password } = req.body;

  if (!username) {
    return res.status(400).json({ message: 'El nombre de usuario es obligatorio' });
  }

  const cleanUsername = String(username).trim();
  if (/\s/.test(cleanUsername)) {
    return res.status(400).json({ message: 'El nombre de usuario no puede contener espacios' });
  }

  try {
    await ensureAdminsColumns();

    const currentRes = await pool.query(
      'SELECT id, username, COALESCE(activo, TRUE) AS activo FROM admins WHERE id = $1',
      [id]
    );
    if (currentRes.rows.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    const currentAdmin = currentRes.rows[0];

    // No puede editar su propio activo (para no autobloquearse)
    const isSelf = String(req.user?.id) === String(id);
    if (isSelf && activo !== undefined && Boolean(activo) !== Boolean(currentAdmin.activo)) {
      return res.status(400).json({ message: 'No puedes cambiar el estado activo de tu propio usuario' });
    }

    // Validar que el username no exista en otro registro
    const duplicateRes = await pool.query(
      'SELECT id FROM admins WHERE LOWER(username) = LOWER($1) AND id <> $2',
      [cleanUsername, id]
    );
    if (duplicateRes.rows.length > 0) {
      return res.status(409).json({ message: 'El nombre de usuario ya está en uso' });
    }

    const nextActivo = isSelf
      ? currentAdmin.activo
      : activo !== undefined
        ? Boolean(activo)
        : currentAdmin.activo;

    // Si se intenta desactivar, verificar que quede al menos 1 admin activo
    if (!nextActivo) {
      const activeCountRes = await pool.query(
        'SELECT COUNT(*)::int AS total FROM admins WHERE COALESCE(activo, TRUE) = TRUE AND id <> $1',
        [id]
      );
      if (activeCountRes.rows[0].total < 1) {
        return res.status(400).json({ message: 'Debe existir al menos un administrador activo' });
      }
    }

    let query;
    let params;

    if (password && String(password).trim() !== '') {
      const password_hash = await bcrypt.hash(password, 10);
      query = `
        UPDATE admins
        SET username = $1,
            nombre_completo = $2,
            activo = $3,
            password_hash = $4
        WHERE id = $5
        RETURNING id, username, nombre_completo, activo, ultimo_acceso, created_at
      `;
      params = [cleanUsername, nombre_completo?.trim() || null, nextActivo, password_hash, id];
    } else {
      query = `
        UPDATE admins
        SET username = $1,
            nombre_completo = $2,
            activo = $3
        WHERE id = $4
        RETURNING id, username, nombre_completo, activo, ultimo_acceso, created_at
      `;
      params = [cleanUsername, nombre_completo?.trim() || null, nextActivo, id];
    }

    const { rows } = await pool.query(query, params);
    res.json(rows[0]);
  } catch (error) {
    console.error(`PUT /usuarios/${id} error:`, error);
    res.status(500).json({ message: 'Error interno al actualizar el usuario' });
  }
});

// DELETE /:id -> Elimina un admin
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  if (String(req.user?.id) === String(id)) {
    return res.status(400).json({ message: 'No puedes eliminar tu propio usuario' });
  }

  try {
    await ensureAdminsColumns();

    const targetRes = await pool.query('SELECT id FROM admins WHERE id = $1', [id]);
    if (targetRes.rows.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    const activeCountRes = await pool.query(
      'SELECT COUNT(*)::int AS total FROM admins WHERE COALESCE(activo, TRUE) = TRUE AND id <> $1',
      [id]
    );
    if (activeCountRes.rows[0].total < 1) {
      return res.status(400).json({ message: 'No se puede eliminar: debe quedar al menos 1 administrador activo' });
    }

    await pool.query('DELETE FROM admins WHERE id = $1', [id]);
    res.json({ message: 'Usuario eliminado correctamente', id });
  } catch (error) {
    console.error(`DELETE /usuarios/${id} error:`, error);
    res.status(500).json({ message: 'Error interno al eliminar el usuario' });
  }
});

module.exports = router;


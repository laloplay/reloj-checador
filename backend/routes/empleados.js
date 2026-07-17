const express = require('express');
const pool = require('../db/pool');
const { indexFace } = require('../services/rekognition');
const jwt = require('jsonwebtoken');

const router = express.Router();

const normalizeDiasDescanso = (value) => {
  if (Array.isArray(value)) {
    return value
      .map((item) => Number(item))
      .filter((item) => Number.isInteger(item) && item >= 0 && item <= 6);
  }

  if (value === '' || value == null) {
    return [];
  }

  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 && parsed <= 6 ? [parsed] : [];
};

const normalizeHorasRegistroFacial = (value) => {
  const allowedValues = [24, 48, 72];
  const parsed = Number(value);
  return allowedValues.includes(parsed) ? parsed : 48;
};

const verifyAdmin = async (req, res, next) => {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token de administrador no proporcionado' });
  }
  const token = authHeader.split(' ')[1];
  const secret = process.env.JWT_SECRET || 'secret';
  try {
    req.user = jwt.verify(token, secret);
    next();
  } catch (error) {
    res.status(403).json({ message: 'Token de administrador inválido' });
  }
};

const allowAdminOrDevice = async (req, res, next) => {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_SECRET || 'secret';

    try {
      req.user = jwt.verify(token, secret);
      return next();
    } catch (error) {
      // Intentamos con device-token como respaldo.
    }
  }

  const deviceToken = req.headers['device-token'] || req.headers['Device-Token'];
  if (!deviceToken) {
    return res.status(403).json({ message: 'device-token header missing' });
  }

  try {
    const { rows } = await pool.query(
      'SELECT id, estado FROM dispositivos WHERE token = $1',
      [deviceToken]
    );

    if (rows.length === 0) {
      return res.status(403).json({ message: 'Dispositivo no encontrado' });
    }

    const dispositivo = rows[0];
    if (dispositivo.estado !== 'aprobado') {
      return res.status(403).json({ message: 'Dispositivo no aprobado' });
    }

    await pool.query('UPDATE dispositivos SET ultimo_acceso = NOW() WHERE id = $1', [dispositivo.id]);

    req.device = dispositivo;
    next();
  } catch (error) {
    console.error('allowAdminOrDevice error:', error);
    res.status(500).json({ message: 'Error interno al validar el acceso' });
  }
};

router.get('/', verifyAdmin, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM empleados ORDER BY created_at DESC');
    res.json(rows);
  } catch (error) {
    console.error('GET empleados error:', error);
    res.status(500).json({ message: 'Error interno' });
  }
});

// El tablero administrativo también requiere este dato; los kioscos siguen
// pudiendo consultarlo con un dispositivo aprobado.
router.get('/pendientes-facial', allowAdminOrDevice, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT
        e.id,
        e.nombre_completo,
        e.sucursal_id,
        s.nombre AS sucursal_nombre,
        e.registro_facial_expira,
        e.registro_facial_horas,
        GREATEST(EXTRACT(EPOCH FROM (e.registro_facial_expira - NOW()))::int, 0) AS segundos_restantes
       FROM empleados e
       LEFT JOIN sucursales s ON s.id = e.sucursal_id
       WHERE e.registro_facial_pendiente = TRUE
         AND e.registro_facial_expira IS NOT NULL
         AND e.registro_facial_expira > NOW()
       ORDER BY e.registro_facial_expira ASC`
    );

    res.json(rows.map((row) => ({
      ...row,
      minutos_restantes: Math.ceil((row.segundos_restantes || 0) / 60),
      tiempo_restante_texto: `${Math.max(Math.ceil((row.segundos_restantes || 0) / 3600), 0)}h ${Math.max(Math.ceil(((row.segundos_restantes || 0) % 3600) / 60), 0)}m`,
    })));
  } catch (error) {
    console.error('GET empleados/pendientes-facial error:', error);
    res.status(500).json({ message: 'Error interno' });
  }
});

router.get('/:id', allowAdminOrDevice, async (req, res) => {
  const { id } = req.params;
  try {
    const { rows } = await pool.query(
      `SELECT
        e.*,
        t.nombre as turno_nombre,
        s.nombre as sucursal_nombre,
        p.nombre as puesto_nombre
      FROM empleados e
      LEFT JOIN turnos t ON e.turno_id = t.id
      LEFT JOIN sucursales s ON e.sucursal_id = s.id
      LEFT JOIN puestos p ON e.puesto_id = p.id
      WHERE e.id = $1`,
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Empleado no encontrado' });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error(`GET empleados/${id} error:`, error);
    res.status(500).json({ message: 'Error interno' });
  }
});


router.post('/', verifyAdmin, async (req, res) => {
  const { nombre_completo, fecha_ingreso, fecha_nacimiento, turno_id, sucursal_id, aplica_bono, puesto_id, dia_descanso, registro_facial_pendiente, registro_facial_horas } = req.body;

  if (!nombre_completo) {
    return res.status(400).json({ message: 'El nombre completo es obligatorio' });
  }

  const registroFacialPendiente = registro_facial_pendiente === true;
  const horasRegistroFacial = normalizeHorasRegistroFacial(registro_facial_horas);

  try {
    const { rows } = await pool.query(`
      INSERT INTO empleados (
        nombre_completo,
        fecha_ingreso,
        fecha_nacimiento,
        turno_id,
        sucursal_id,
        aplica_bono,
        puesto_id,
        dia_descanso,
        registro_facial_pendiente,
        registro_facial_expira,
        registro_facial_horas
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CASE WHEN $9 THEN NOW() + ($10::int * INTERVAL '1 hour') ELSE NULL END, $10)
      RETURNING *`, [
      nombre_completo,
      fecha_ingreso || null,
      fecha_nacimiento || null,
      turno_id,
      sucursal_id,
      aplica_bono !== false,
      puesto_id,
      normalizeDiasDescanso(dia_descanso),
      registroFacialPendiente,
      horasRegistroFacial,
    ]);
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('POST empleados error:', error);
    res.status(500).json({ message: 'Error interno' });
  }
});

router.put('/:id', verifyAdmin, async (req, res) => {
  const { id } = req.params;
  const { nombre_completo, fecha_ingreso, fecha_nacimiento, turno_id, sucursal_id, aplica_bono, puesto_id, dia_descanso, registro_facial_pendiente, registro_facial_horas } = req.body;

  const registroFacialPendiente = registro_facial_pendiente === true;
  const horasRegistroFacial = normalizeHorasRegistroFacial(registro_facial_horas);

  try {
    const { rows } = await pool.query(`UPDATE empleados SET nombre_completo = $1, fecha_ingreso = $2, fecha_nacimiento = $3, turno_id = $4, sucursal_id = $5, aplica_bono = $6, puesto_id = $7, dia_descanso = $8, registro_facial_pendiente = $9, registro_facial_expira = CASE WHEN $9 THEN NOW() + ($10::int * INTERVAL '1 hour') ELSE NULL END, registro_facial_horas = $10 WHERE id = $11 RETURNING *`, [
      nombre_completo,
      fecha_ingreso || null,
      fecha_nacimiento || null,
      turno_id,
      sucursal_id,
      aplica_bono,
      puesto_id,
      normalizeDiasDescanso(dia_descanso),
      registroFacialPendiente,
      horasRegistroFacial,
      id,
    ]);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Empleado no encontrado' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('PUT empleados error:', error);
    res.status(500).json({ message: 'Error interno' });
  }
});

router.post('/:id/foto', allowAdminOrDevice, async (req, res) => {
  const { id } = req.params;
  const { imagen } = req.body;

  if (!imagen) {
    return res.status(400).json({ message: 'imagen es requerida' });
  }

  try {
    const resultado = await indexFace(imagen, id);
    const faceRecord = resultado.FaceRecords?.[0];

    if (!faceRecord) {
      return res.status(400).json({ message: 'No se detectó un rostro en la imagen' });
    }

    const faceId = faceRecord.Face.FaceId;

    const { rows } = await pool.query(
      'UPDATE empleados SET face_id = $1, registro_facial_pendiente = FALSE, registro_facial_expira = NULL WHERE id = $2 RETURNING *',
      [faceId, id]
    );

    res.json(rows[0]);
  } catch (error) {
    console.error('POST empleados/:id/foto error:', error);
    res.status(500).json({ message: 'Error al procesar la imagen' });
  }
});

router.delete('/:id', verifyAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const { rows } = await pool.query(
      'UPDATE empleados SET activo = false WHERE id = $1 RETURNING *',
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Empleado no encontrado' });
    }
    res.status(200).json(rows[0]);
  } catch (error) {
    console.error('DELETE empleados error:', error);
    res.status(500).json({ message: 'Error interno' });
  }
});

module.exports = router;

const express = require('express');
const pool = require('../db/pool');
const { indexFace } = require('../services/rekognition');
const { generarAudiosEmpleado, eliminarAudiosEmpleado } = require('../services/polly');
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

const DEVICE_JWT_SECRET = process.env.DEVICE_JWT_SECRET || 'tu-super-secreto-para-dispositivos';

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

  const deviceJwt = req.headers['device-token'];
  if (!deviceJwt) {
    return res.status(401).json({ message: 'Falta token de administrador o de dispositivo' });
  }

  try {
    const decoded = jwt.verify(deviceJwt, DEVICE_JWT_SECRET);
    if (decoded.tipo !== 'device-auth') throw new Error('Tipo de token inválido');

    const { rows } = await pool.query('SELECT id, estado FROM dispositivos WHERE id = $1', [decoded.dispositivo_id]);
    if (rows.length === 0) {
      return res.status(403).json({ message: 'Dispositivo no encontrado' });
    }

    const dispositivo = rows[0];
    if (dispositivo.estado !== 'aprobado') {
      return res.status(403).json({ message: `Dispositivo no aprobado. Estado: ${dispositivo.estado}` });
    }

    await pool.query('UPDATE dispositivos SET ultimo_acceso = NOW() WHERE id = $1', [dispositivo.id]);

    req.device = dispositivo;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError || error instanceof jwt.JsonWebTokenError) {
      return res.status(403).json({ message: 'Token de dispositivo inválido o expirado.' });
    }
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
    const empleadoCreado = rows[0];
    res.status(201).json(empleadoCreado);

    generarAudiosEmpleado(empleadoCreado)
      .then(() => pool.query('UPDATE empleados SET audios_generados = true WHERE id = $1', [empleadoCreado.id]))
      .catch((err) => console.warn('No se pudieron generar audios para el empleado nuevo:', err.message || err));
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

    const empleadoActualizado = rows[0];
    const antesRes = await pool.query('SELECT nombre_completo FROM empleados WHERE id = $1', [id]);
    const nombreAnterior = antesRes.rows[0]?.nombre_completo;

    if (nombreAnterior && nombreAnterior !== nombre_completo) {
      eliminarAudiosEmpleado(id).catch((err) => console.error('Error eliminando audios antiguos:', err));
      await pool.query('UPDATE empleados SET audios_generados = false WHERE id = $1', [id]);

      generarAudiosEmpleado({ id, nombre_completo })
        .then(() => pool.query('UPDATE empleados SET audios_generados = true WHERE id = $1', [id]))
        .catch((err) => console.warn('No se pudieron regenerar los audios:', err.message || err));
    }

    res.json(empleadoActualizado);
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

router.post('/:id/regenerar-audio', verifyAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    const { rows } = await pool.query('SELECT * FROM empleados WHERE id = $1', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Empleado no encontrado' });
    }

    const empleado = rows[0];
    await eliminarAudiosEmpleado(id);
    await generarAudiosEmpleado(empleado);
    await pool.query('UPDATE empleados SET audios_generados = true WHERE id = $1', [id]);

    res.json({ message: 'Audios regenerados correctamente' });
  } catch (error) {
    if (error?.code === 'POLLY_ACCESS_DENIED') {
      return res.status(503).json({
        message: 'AWS Polly no tiene permisos. Agrega polly:SynthesizeSpeech al usuario/rol de IAM.',
      });
    }
    console.error('Error regenerando audios:', error);
    res.status(500).json({ message: 'Error al regenerar audios' });
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

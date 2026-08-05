const express = require('express');
const pool = require('../db/pool');
const jwt = require('jsonwebtoken');

const router = express.Router();

// Es crucial que definas esta variable en tu archivo .env para máxima seguridad
const DEVICE_JWT_SECRET = process.env.DEVICE_JWT_SECRET || 'tu-super-secreto-para-dispositivos';

// Middleware para verificar administradores (asumiendo que existe uno similar a empleados.js)
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

// POST /registrar - Registra un nuevo dispositivo con su nombre y ubicación
router.post('/registrar', async (req, res) => {
    const { fingerprint, nombre_dispositivo, ubicacion } = req.body;
    if (!fingerprint || !nombre_dispositivo) {
        return res.status(400).json({ message: 'El fingerprint y el nombre del dispositivo son requeridos' });
    }

    try {
        // "Candado": Verificar si ya existe una solicitud pendiente para este dispositivo.
        const existingDeviceRes = await pool.query('SELECT estado FROM dispositivos WHERE fingerprint = $1', [fingerprint]);
        if (existingDeviceRes.rows.length > 0 && existingDeviceRes.rows[0].estado === 'pendiente') {
            return res.status(409).json({ 
                message: 'Este dispositivo ya tiene una solicitud pendiente. Espere la aprobación de un administrador.',
                ...existingDeviceRes.rows[0] 
            });
        }

        // Si no está pendiente (o no existe), procedemos a insertar o actualizar.
        // La cláusula ON CONFLICT ahora también resetea el estado a 'pendiente',
        // lo que corrige el bug de que un dispositivo rechazado no podía volver a solicitar.
        const { rows } = await pool.query(
            `INSERT INTO dispositivos (fingerprint, nombre_dispositivo, ubicacion, estado, ultimo_acceso)
             VALUES ($1, $2, $3, 'pendiente', NOW())
             ON CONFLICT (fingerprint) DO UPDATE SET
               nombre_dispositivo = EXCLUDED.nombre_dispositivo,
               ubicacion = EXCLUDED.ubicacion,
               estado = 'pendiente',
               ultimo_acceso = NOW()
             RETURNING id, estado, nombre_dispositivo, ubicacion`,
            [fingerprint, nombre_dispositivo, ubicacion || null]
        );
        res.status(201).json(rows[0]);
    } catch (error) {
        console.error('POST /dispositivos/registrar error:', error);
        res.status(500).json({ message: 'Error interno al registrar el dispositivo' });
    }
});

// GET /status/:fingerprint - Verifica el estado de un dispositivo que aún no tiene token
router.get('/status/:fingerprint', async (req, res) => {
    const { fingerprint } = req.params;
    try {
        const { rows } = await pool.query('SELECT estado FROM dispositivos WHERE fingerprint = $1', [fingerprint]);
        if (rows.length === 0) {
            // Es un dispositivo genuinamente nuevo, no está en la BD.
            return res.status(404).json({ estado: 'no_encontrado' });
        }
        // Devuelve el estado actual ('pendiente', 'aprobado', 'rechazado')
        res.json({ estado: rows[0].estado });
    } catch (error) {
        console.error(`GET /dispositivos/status/${fingerprint} error:`, error);
        res.status(500).json({ message: 'Error interno al verificar estado del dispositivo' });
    }
});

// POST /claim-token - Permite a un dispositivo aprobado obtener su token por primera vez
router.post('/claim-token', async (req, res) => {
    const { fingerprint } = req.body;
    if (!fingerprint) {
        return res.status(400).json({ message: 'Fingerprint es requerido.' });
    }

    try {
        const { rows } = await pool.query(
            'SELECT token, estado FROM dispositivos WHERE fingerprint = $1',
            [fingerprint]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Dispositivo no encontrado.' });
        }

        const dispositivo = rows[0];
        if (dispositivo.estado !== 'aprobado' || !dispositivo.token) {
            return res.status(403).json({ message: 'El dispositivo no está listo o aprobado para reclamar un token.', estado: dispositivo.estado });
        }

        res.json({ token: dispositivo.token });

    } catch (error) {
        console.error('POST /dispositivos/claim-token error:', error);
        res.status(500).json({ message: 'Error interno al reclamar el token.' });
    }
});

// GET /verificar - Verifica un dispositivo usando el JWT de 2 años
router.get('/verificar', async (req, res) => {
    const deviceJwt = req.headers['device-token'];
    if (!deviceJwt) {
        return res.status(401).json({ estado: 'rechazado', message: 'Device token no proporcionado' });
    }

    try {
        const decoded = jwt.verify(deviceJwt, DEVICE_JWT_SECRET);
        if (decoded.tipo !== 'device-auth') throw new Error('Tipo de token inválido');

        const { rows } = await pool.query('UPDATE dispositivos SET ultimo_acceso = NOW() WHERE id = $1 RETURNING estado', [decoded.dispositivo_id]);
        if (rows.length === 0 || rows[0].estado !== 'aprobado') {
            return res.status(403).json({ estado: rows[0]?.estado || 'rechazado', message: 'Dispositivo no aprobado.' });
        }
        return res.json({ estado: 'aprobado', token: deviceJwt });

    } catch (error) {
        if (error instanceof jwt.TokenExpiredError || error instanceof jwt.JsonWebTokenError) {
            try {
                const decoded = jwt.decode(deviceJwt);
                if (!decoded || !decoded.fingerprint) {
                    return res.status(403).json({ estado: 'rechazado', message: 'Token inválido, no se pudo decodificar.' });
                }

                const { rows } = await pool.query('SELECT * FROM dispositivos WHERE fingerprint = $1', [decoded.fingerprint]);
                const dispositivo = rows[0];

                if (!dispositivo || dispositivo.estado !== 'aprobado') {
                    return res.status(403).json({ estado: dispositivo?.estado || 'rechazado', message: 'Dispositivo no encontrado o no aprobado.' });
                }

                const newPayload = { dispositivo_id: dispositivo.id, fingerprint: dispositivo.fingerprint, tipo: 'device-auth' };
                const newToken = jwt.sign(newPayload, DEVICE_JWT_SECRET, { expiresIn: '2y' });
                const newExpiry = new Date();
                newExpiry.setFullYear(newExpiry.getFullYear() + 2);

                await pool.query(
                    'UPDATE dispositivos SET token = $1, token_expira = $2, ultimo_acceso = NOW() WHERE id = $3',
                    [newToken, newExpiry, dispositivo.id]
                );

                return res.json({ estado: 'aprobado', token: newToken, message: 'Token regenerado.' });
            } catch (fallbackError) {
                console.error('GET /dispositivos/verificar fallback error:', fallbackError);
                return res.status(403).json({ estado: 'rechazado', message: 'Verificación de respaldo fallida.' });
            }
        }
        console.error('GET /dispositivos/verificar error:', error);
        return res.status(500).json({ message: 'Error interno del servidor' });
    }
});

// PUT /:id/aprobar - Genera el JWT cuando un admin aprueba y asigna sucursal
router.put('/:id/aprobar', verifyAdmin, async (req, res) => {
    const { id } = req.params;
    const { sucursal_id } = req.body;
    if (!sucursal_id) {
        return res.status(400).json({ message: 'La sucursal es requerida para aprobar.' });
    }

    try {
        const { rows } = await pool.query('SELECT * FROM dispositivos WHERE id = $1', [id]);
        if (rows.length === 0) return res.status(404).json({ message: 'Dispositivo no encontrado' });
        
        const dispositivo = rows[0];
        const payload = { dispositivo_id: dispositivo.id, fingerprint: dispositivo.fingerprint, tipo: 'device-auth' };
        const token = jwt.sign(payload, DEVICE_JWT_SECRET, { expiresIn: '2y' });
        const expiryDate = new Date();
        expiryDate.setFullYear(expiryDate.getFullYear() + 2);

        const updatedDeviceRes = await pool.query(
            `UPDATE dispositivos
             SET estado = 'aprobado', token = $1, token_expira = $2, sucursal_id = $3, aprobado_por = $4, aprobado_en = NOW()
             WHERE id = $5
             RETURNING *`,
            [token, expiryDate, sucursal_id, req.user.id, id]
        );

        res.json(updatedDeviceRes.rows[0]);
    } catch (error) {
        console.error(`PUT /dispositivos/${id}/aprobar error:`, error);
        res.status(500).json({ message: 'Error interno al aprobar el dispositivo' });
    }
});

// PUT /:id/rechazar - Rechaza un dispositivo pendiente
router.put('/:id/rechazar', verifyAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        const { rows } = await pool.query(
            "UPDATE dispositivos SET estado = 'rechazado', aprobado_por = $1, aprobado_en = NOW() WHERE id = $2 RETURNING *",
            [req.user.id, id]
        );
        if (rows.length === 0) return res.status(404).json({ message: 'Dispositivo no encontrado' });
        res.json(rows[0]);
    } catch (error) {
        console.error(`PUT /dispositivos/${id}/rechazar error:`, error);
        res.status(500).json({ message: 'Error interno al rechazar el dispositivo' });
    }
});

// GET / - Devuelve todos los dispositivos para el panel de admin
router.get('/', verifyAdmin, async (req, res) => {
    const { estado } = req.query;
    try {
        let query = 'SELECT d.*, s.nombre as sucursal_nombre FROM dispositivos d LEFT JOIN sucursales s ON d.sucursal_id = s.id';
        const params = [];

        if (estado) {
            query += ' WHERE d.estado = $1';
            params.push(estado);
        }

        query += ' ORDER BY d.created_at DESC';

        const { rows } = await pool.query(query, params);
        res.json(rows);
    } catch (error) {
        console.error('GET /dispositivos error:', error);
        res.status(500).json({ message: 'Error interno' });
    }
});

module.exports = router;

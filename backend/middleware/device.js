const pool = require('../db/pool');

async function verifyDevice(req, res, next) {
  const deviceToken = req.headers['device-token'] || req.headers['Device-Token'];
  if (!deviceToken) {
    return res.status(403).json({ message: 'device-token header missing' });
  }

  try {
    const { rows } = await pool.query(
      'SELECT id, estado, sucursal_id FROM dispositivos WHERE token = $1',
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
    console.error('verifyDevice middleware error:', error);
    res.status(500).json({ message: 'Error interno al validar el dispositivo' });
  }
}

module.exports = verifyDevice;
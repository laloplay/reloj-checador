const express = require('express');
const pool = require('../db/pool');
const authenticateAdmin = require('../middleware/auth');

const router = express.Router();
router.use(authenticateAdmin);

router.post('/limpiar-faciales-expirados', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `UPDATE empleados
       SET activo = FALSE,
           face_id = NULL,
           foto_url = NULL,
           registro_facial_pendiente = FALSE,
           registro_facial_expira = NULL
       WHERE registro_facial_expira IS NOT NULL
         AND registro_facial_expira < NOW()
       RETURNING id`
    );

    res.json({ limpiados: rows.length });
  } catch (error) {
    console.error('POST mantenimiento/limpiar-faciales-expirados error:', error);
    res.status(500).json({ message: 'Error interno' });
  }
});

module.exports = router;
const express = require('express');
const dayjs = require('dayjs');
const pool = require('../db/pool');
const verifyDevice = require('../middleware/device');
const { searchFace } = require('../services/rekognition');
const { construirDiasEmpleado } = require('../services/registros');

require('dayjs/locale/es');
dayjs.locale('es');

const router = express.Router();

router.post('/consultar', verifyDevice, async (req, res) => {
  const { imagen } = req.body;
  if (!imagen) {
    return res.status(400).json({ message: 'La imagen es requerida' });
  }

  try {
    const recognition = await searchFace(imagen);
    const match = recognition.FaceMatches?.[0];
    if (!match?.Face?.FaceId) {
      return res.status(404).json({ message: 'No se reconoció el rostro' });
    }

    const empleadoRes = await pool.query(
      `SELECT
         e.id, e.nombre_completo, e.fecha_ingreso, e.fecha_nacimiento, e.dia_descanso,
         p.nombre AS puesto_nombre,
         s.nombre AS sucursal_nombre,
         t.hora_inicio AS turno_hora_inicio,
         t.hora_fin AS turno_hora_fin
       FROM empleados e
       LEFT JOIN puestos p ON e.puesto_id = p.id
       LEFT JOIN sucursales s ON e.sucursal_id = s.id
       LEFT JOIN turnos t ON e.turno_id = t.id
       WHERE e.face_id = $1 AND e.activo = TRUE`,
      [match.Face.FaceId]
    );

    if (empleadoRes.rows.length === 0) {
      return res.status(404).json({ message: 'Empleado no encontrado o inactivo' });
    }

    const empleado = empleadoRes.rows[0];
    const hoy = dayjs();
    const calendario = await construirDiasEmpleado(
      empleado.id,
      empleado.dia_descanso,
      hoy.startOf('month').toDate(),
      hoy.endOf('month').toDate(),
      pool
    );

    res.json({
      empleado,
      resumen: {
        mes: hoy.format('MMMM [de] YYYY'),
        asistencias: calendario.estadisticas.total_entradas - calendario.estadisticas.total_retardos,
        retardos: calendario.estadisticas.total_retardos,
        faltas: calendario.estadisticas.total_faltas,
        bonos: calendario.estadisticas.total_bonos,
        dias: calendario.dias,
        bono_primera_quincena: calendario.bono_primera_quincena,
        bono_segunda_quincena: calendario.bono_segunda_quincena,
      },
    });
  } catch (error) {
    console.error('POST /portal/consultar error:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

module.exports = router;

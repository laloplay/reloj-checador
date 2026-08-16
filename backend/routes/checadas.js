const express = require('express');
const pool = require('../db/pool');
const verifyDevice = require('../middleware/device');
const { searchFace } = require('../services/rekognition');
const { calcularChecada } = require('../services/turnos');

const router = express.Router();

router.post('/', verifyDevice, async (req, res) => {
    const { imagen, tipo = 'entrada' } = req.body;
    if (!imagen) {
        return res.status(400).json({ message: 'imagen es requerida' });
    }

    try {
        const recognition = await searchFace(imagen);
        const match = recognition.FaceMatches?.[0];
        if (!match || !match.Face || !match.Face.FaceId) {
            return res.status(404).json({ message: 'No se encontró una coincidencia facial' });
        }

        const faceId = match.Face.FaceId;
        const confidence = match.Similarity || null;

        const empleadoResult = await pool.query(
            'SELECT e.id AS empleado_id, e.turno_id, e.aplica_bono, e.registro_facial_pendiente, t.hora_inicio, t.minutos_bono, t.bono_activo FROM empleados e LEFT JOIN turnos t ON e.turno_id = t.id WHERE e.face_id = $1',
            [faceId]
        );

        if (empleadoResult.rows.length === 0) {
            return res.status(404).json({ message: 'Empleado no encontrado' });
        }

        const empleado = empleadoResult.rows[0];
        if (empleado.registro_facial_pendiente) {
            return res.status(403).json({ message: 'Debe completar el registro facial primero' });
        }
        const empleadoId = empleado.empleado_id;

        // Validar que solo se pueda registrar una entrada y una salida por día, y en el orden correcto.
        const hoy = new Date();
        const checadasDelDiaRes = await pool.query(
            `SELECT tipo FROM checadas 
             WHERE empleado_id = $1 
               AND timestamp >= $2::date 
               AND timestamp < ($2::date + '1 day'::interval)
             ORDER BY timestamp ASC`,
            [empleadoId, hoy]
        );

        const checadasDelDia = checadasDelDiaRes.rows;

        if (tipo === 'entrada') {
            if (checadasDelDia.some(c => c.tipo === 'entrada')) {
                return res.status(409).json({ message: `Solo se permite un registro de 'entrada' por día.` });
            }
        } else if (tipo === 'salida') {
            if (checadasDelDia.some(c => c.tipo === 'salida')) {
                return res.status(409).json({ message: `Solo se permite un registro de 'salida' por día.` });
            }
            if (!checadasDelDia.some(c => c.tipo === 'entrada')) {
                return res.status(400).json({ message: `Debes registrar una 'entrada' antes de poder registrar una 'salida'.` });
            }
        }

        const calculo = empleado.turno_id ?
            calcularChecada({
                hora_inicio: empleado.hora_inicio,
                minutos_bono: empleado.minutos_bono
            }, new Date()) : {
                tiene_bono: false,
                es_retardo: false,
                minutos_diferencia: 0,
            };

        // Sobreescribe el bono si alguno de los dos lo tiene desactivado
        if (empleado.bono_activo === false || empleado.aplica_bono === false) {
          calculo.tiene_bono = false
        }

        const insertResult = await pool.query(
            `INSERT INTO checadas (
                empleado_id,
                dispositivo_id,
                sucursal_id,
                tipo,
                turno_id,
                tiene_bono,
                es_retardo,
                minutos_diferencia,
                confianza_facial
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING id, timestamp, tipo, tiene_bono, es_retardo, minutos_diferencia`,
            [empleadoId, req.device.id, req.device.sucursal_id, tipo, empleado.turno_id, calculo.tiene_bono, calculo.es_retardo, calculo.minutos_diferencia, confidence]
        );

        res.status(201).json({
            ...insertResult.rows[0],
            empleado_id: empleadoId,
            confianza_facial: confidence,
        });
    } catch (error) {
        console.error('POST checadas error:', error);
        res.status(500).json({ message: 'Error interno' });
    }
});

module.exports = router;

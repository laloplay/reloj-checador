const express = require('express');
const pool = require('../db/pool');
const authenticateAdmin = require('../middleware/auth');

const router = express.Router();
router.use(authenticateAdmin);

const startOfDay = (date) => {
    const d = new Date(date);
    d.setUTCHours(0, 0, 0, 0);
    return d;
};

const endOfDay = (date) => {
    const d = new Date(date);
    d.setUTCHours(23, 59, 59, 999);
    return d;
};

router.get('/calcular', async (req, res) => {
    const { tipo = 'semanal', fecha, sucursal_id } = req.query;
    const fechaBase = fecha ? new Date(`${fecha}T00:00:00`) : new Date();

    let fechaInicio;
    let fechaFin;

    // 1. Calcula el rango de fechas según tipo
    switch (tipo) {
        case 'quincenal':
            if (fechaBase.getUTCDate() <= 15) {
                fechaInicio = new Date(Date.UTC(fechaBase.getUTCFullYear(), fechaBase.getUTCMonth(), 1));
                fechaFin = new Date(Date.UTC(fechaBase.getUTCFullYear(), fechaBase.getUTCMonth(), 15));
            } else {
                fechaInicio = new Date(Date.UTC(fechaBase.getUTCFullYear(), fechaBase.getUTCMonth(), 16));
                fechaFin = new Date(Date.UTC(fechaBase.getUTCFullYear(), fechaBase.getUTCMonth() + 1, 0));
            }
            break;
        case 'mensual':
            fechaInicio = new Date(Date.UTC(fechaBase.getUTCFullYear(), fechaBase.getUTCMonth(), 1));
            fechaFin = new Date(Date.UTC(fechaBase.getUTCFullYear(), fechaBase.getUTCMonth() + 1, 0));
            break;
        case 'semanal':
        default:
            const primerDia = fechaBase.getUTCDate() - fechaBase.getUTCDay() + (fechaBase.getUTCDay() === 0 ? -6 : 1);
            fechaInicio = new Date(Date.UTC(fechaBase.getUTCFullYear(), fechaBase.getUTCMonth(), primerDia));
            fechaFin = new Date(fechaInicio);
            fechaFin.setUTCDate(fechaInicio.getUTCDate() + 6);
            break;
    }

    const rangoInicio = startOfDay(fechaInicio);
    const rangoFin = endOfDay(fechaFin);

    // 2. Calcula dias_laborables del período (excluyendo domingos)
    let dias_laborables = 0;
    const current = new Date(rangoInicio);
    while (current <= rangoFin) {
        if (current.getUTCDay() !== 0) { // 0 es Domingo
            dias_laborables++;
        }
        current.setUTCDate(current.getUTCDate() + 1);
    }

    if (dias_laborables === 0) {
        return res.json([]);
    }

    try {
        // 3. Trae todos los empleados activos con puesto asignado
        const empleadosRes = await pool.query(
            `SELECT e.id, e.nombre_completo,
                    p.nombre AS puesto_nombre, p.salario_base,
                    e.sucursal_id
             FROM empleados e
             JOIN puestos p ON e.puesto_id = p.id
             WHERE e.activo = true AND e.puesto_id IS NOT NULL
             AND ($1::uuid IS NULL OR e.sucursal_id = $1)`,
            [sucursal_id || null]
        );

        // 4. Para cada empleado, calcula su nómina
        const nominaCalculada = await Promise.all(
            empleadosRes.rows.map(async (empleado) => {
                const diasTrabajadosRes = await pool.query(
                    `SELECT COUNT(DISTINCT DATE(timestamp))::int AS dias_trabajados
                     FROM checadas
                     WHERE empleado_id = $1 AND tipo = 'entrada' AND timestamp >= $2 AND timestamp <= $3`,
                    [empleado.id, rangoInicio, rangoFin]
                );

                const dias_trabajados = diasTrabajadosRes.rows[0].dias_trabajados;
                const faltas = Math.max(0, dias_laborables - dias_trabajados);

                // 5. Calcula salario
                const salario_base = parseFloat(empleado.salario_base);
                const descuento = (salario_base / dias_laborables) * faltas;
                const salario_neto = salario_base - descuento;

                return {
                    empleado_id: empleado.id,
                    nombre_completo: empleado.nombre_completo,
                    puesto: empleado.puesto_nombre,
                    salario_base,
                    dias_laborables,
                    dias_trabajados,
                    faltas,
                    descuento: parseFloat(descuento.toFixed(2)),
                    salario_neto: parseFloat(salario_neto.toFixed(2)),
                };
            })
        );

        // 6. Regresa el array completo
        res.json({ nomina: nominaCalculada, periodo: { inicio: rangoInicio.toISOString().split('T')[0], fin: rangoFin.toISOString().split('T')[0], tipo } });
    } catch (error) {
        console.error('GET /nomina/calcular error:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
});

module.exports = router;
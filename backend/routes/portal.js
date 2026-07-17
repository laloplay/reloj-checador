const express = require('express');
const dayjs = require('dayjs');
const isBetween = require('dayjs/plugin/isBetween');
const pool = require('../db/pool');
const verifyDevice = require('../middleware/device');
const { searchFace } = require('../services/rekognition');

require('dayjs/locale/es');
dayjs.extend(isBetween);
dayjs.locale('es');

const router = express.Router();

router.post('/consultar', verifyDevice, async (req, res) => {
    const { imagen } = req.body;
    if (!imagen) {
        return res.status(400).json({ message: 'La imagen es requerida' });
    }

    try {
        // 1. Reconocer el rostro
        const recognition = await searchFace(imagen);
        const match = recognition.FaceMatches?.[0];
        if (!match || !match.Face || !match.Face.FaceId) {
            return res.status(404).json({ message: 'No se reconoció el rostro' });
        }

        const faceId = match.Face.FaceId;

        // 2. Obtener datos del empleado
        const empleadoRes = await pool.query(
            `SELECT
                e.id, e.nombre_completo, e.fecha_ingreso, e.fecha_nacimiento, e.dia_descanso,
                p.nombre as puesto_nombre,
                s.nombre as sucursal_nombre
             FROM empleados e
             LEFT JOIN puestos p ON e.puesto_id = p.id
             LEFT JOIN sucursales s ON e.sucursal_id = s.id
             WHERE e.face_id = $1 AND e.activo = TRUE`,
            [faceId]
        );

        if (empleadoRes.rows.length === 0) {
            return res.status(404).json({ message: 'Empleado no encontrado o inactivo' });
        }
        const empleado = empleadoRes.rows[0];

        // 3. Calcular rango de fechas para el mes actual
        const hoy = dayjs();
        const inicioMes = hoy.startOf('month');
        const finMes = hoy.endOf('month');

        // 4. Obtener datos adicionales del mes
        const festivosRes = await pool.query(
            `SELECT nombre, fecha, aplica_todos_los_años FROM dias_festivos WHERE activo = TRUE`
        );

        const ausenciasRes = await pool.query(
            `SELECT tipo, fecha_inicio, fecha_fin, motivo
             FROM ausencias
             WHERE empleado_id = $1
               AND aprobado = TRUE
               AND fecha_fin >= $2
               AND fecha_inicio <= $3`,
            [empleado.id, inicioMes.toISOString(), finMes.toISOString()]
        );

        const checadasRes = await pool.query(
            `SELECT timestamp, tipo, es_retardo, tiene_bono
             FROM checadas
             WHERE empleado_id = $1
               AND timestamp BETWEEN $2 AND $3
             ORDER BY timestamp ASC`,
            [empleado.id, inicioMes.toISOString(), finMes.toISOString()]
        );

        // 5. Procesar y agrupar datos para fácil acceso
        const festivosMap = new Map();
        for (const f of festivosRes.rows) {
            if (f.aplica_todos_los_años) {
                festivosMap.set(dayjs(f.fecha).format('MM-DD'), f);
            } else {
                festivosMap.set(dayjs(f.fecha).format('YYYY-MM-DD'), f);
            }
        }
        const ausencias = ausenciasRes.rows;
        const checadasPorDia = new Map();
        for (const c of checadasRes.rows) {
            const fechaStr = dayjs(c.timestamp).format('YYYY-MM-DD');
            if (!checadasPorDia.has(fechaStr)) {
                checadasPorDia.set(fechaStr, { entradas: [], salidas: [] });
            }
            const checadas = checadasPorDia.get(fechaStr);
            if (c.tipo === 'entrada') checadas.entradas.push(c);
            else checadas.salidas.push(c);
        }

        // 6. Construir el calendario del mes
        const diasDelMes = [];
        let totalAsistencias = 0;
        let totalRetardos = 0;
        let totalFaltas = 0;
        let totalBonos = 0;

        for (let i = 0; i < hoy.daysInMonth(); i++) {
            const diaActual = inicioMes.add(i, 'day');
            const fechaStr = diaActual.format('YYYY-MM-DD');
            const diaSemana = diaActual.day();
            const esFuturo = diaActual.isAfter(hoy, 'day');

            const diaData = {
                fecha: fechaStr,
                dia_semana: diaActual.format('dddd'),
                dia_num: diaActual.date(),
                es_futuro: esFuturo,
                hora_entrada: null,
                hora_salida: null,
                es_retardo: false,
                tiene_bono: false,
                condiciones: [],
                asistencia_en_dia_no_laborable: false,
            };

            if (esFuturo) {
                diaData.condiciones.push({ tipo: 'futuro', label: 'Futuro' });
            } else {
                const checadasDelDia = checadasPorDia.get(fechaStr);
                let tieneChecada = false;
                let esDiaNoLaborable = false;

                // Condición 1: Checadas (Puntual/Retardo)
                if (checadasDelDia && checadasDelDia.entradas.length > 0) {
                    tieneChecada = true;
                    const primeraEntrada = checadasDelDia.entradas[0];
                    diaData.hora_entrada = dayjs(primeraEntrada.timestamp).format('HH:mm');
                    diaData.es_retardo = primeraEntrada.es_retardo;
                    diaData.tiene_bono = primeraEntrada.tiene_bono;

                    if (primeraEntrada.es_retardo) {
                        diaData.condiciones.push({ tipo: 'retardo', label: 'Retardo' });
                        totalRetardos++;
                    } else {
                        diaData.condiciones.push({ tipo: 'puntual', label: 'Puntual' });
                        totalAsistencias++;
                    }
                    if (primeraEntrada.tiene_bono) totalBonos++;

                    if (checadasDelDia.salidas.length > 0) {
                        const ultimaSalida = checadasDelDia.salidas[checadasDelDia.salidas.length - 1];
                        diaData.hora_salida = dayjs(ultimaSalida.timestamp).format('HH:mm');
                    }
                }

                // Condición 2: Ausencias (Vacaciones/Permiso)
                const ausenciasDelDia = ausencias.filter(a => diaActual.isBetween(dayjs(a.fecha_inicio).startOf('day'), dayjs(a.fecha_fin).endOf('day'), null, '[]'));
                if (ausenciasDelDia.length > 0) {
                    ausenciasDelDia.forEach(ausencia => {
                        diaData.condiciones.push({
                            tipo: ausencia.tipo,
                            label: ausencia.tipo.charAt(0).toUpperCase() + ausencia.tipo.slice(1),
                            motivo: ausencia.motivo
                        });
                    });
                    esDiaNoLaborable = true;
                }

                // Condición 3: Días Festivos
                const festivoDelDia = festivosMap.get(fechaStr) || festivosMap.get(diaActual.format('MM-DD'));
                if (festivoDelDia) {
                    diaData.condiciones.push({ tipo: 'festivo', label: 'Día Festivo', motivo: festivoDelDia.nombre });
                    esDiaNoLaborable = true;
                }

                // Condición 4: Descanso semanal
                const esDescanso = (empleado.dia_descanso || []).includes(diaSemana);
                if (esDescanso) {
                    diaData.condiciones.push({ tipo: 'descanso', label: 'Descanso' });
                    esDiaNoLaborable = true;
                }

                // Condición 5: Cumpleaños
                const esCumpleanos = empleado.fecha_nacimiento && diaActual.format('MM-DD') === dayjs(empleado.fecha_nacimiento).format('MM-DD');
                if (esCumpleanos) {
                    const edad = diaActual.year() - dayjs(empleado.fecha_nacimiento).year();
                    const primerNombre = empleado.nombre_completo.split(' ')[0];
                    diaData.condiciones.push({
                        tipo: 'cumpleanos',
                        label: '¡Felicidades!',
                        motivo: `¡Feliz cumpleaños número ${edad}, ${primerNombre}!`
                    });
                    esDiaNoLaborable = true;
                }

                // Condición 6: Falta (si es día laborable y no hay checada)
                if (!tieneChecada && !esDiaNoLaborable) {
                    diaData.condiciones.push({ tipo: 'falta', label: 'Falta' });
                    totalFaltas++;
                }

                // Condición 7: Asistencia en día no laborable (para resaltar)
                if (tieneChecada && esDiaNoLaborable) {
                    diaData.asistencia_en_dia_no_laborable = true;
                }
            }
            diasDelMes.push(diaData);
        }

        // 7. Calcular bonos quincenales
        const calcularBonoQuincena = (diasQuincena) => {
            // Si la quincena no ha terminado, el bono está "en curso"
            if (diasQuincena.some(d => d.es_futuro)) {
                return null; // En curso
            }

            // 1. Filtrar días evaluables (no futuros, no solo descanso/festivo sin checada)
            const diasEvaluables = diasQuincena.filter(dia => {
                if (dia.es_futuro) return false;
                const esSoloDescansoOFestivo = dia.condiciones.every(c => ['descanso', 'festivo'].includes(c.tipo)) && !dia.hora_entrada;
                return !esSoloDescansoOFestivo;
            });

            // 2. Si no hay días evaluables, el bono no aplica para este periodo (retorna null).
            if (diasEvaluables.length === 0) {
                return null;
            }

            // 3. Si algún día evaluable tiene una condición invalidante, el bono es falso.
            const invalidaBono = diasEvaluables.some(dia =>
                dia.condiciones.some(c => ['retardo', 'falta', 'permiso', 'vacaciones'].includes(c.tipo))
            );
            if (invalidaBono) {
                return false;
            }

            // 5. Si pasa las validaciones, el bono es verdadero.
            return true;
        };

        const diasPrimeraQuincena = diasDelMes.filter(d => d.dia_num <= 15);
        const diasSegundaQuincena = diasDelMes.filter(d => d.dia_num > 15);

        const bono_primera_quincena = calcularBonoQuincena(diasPrimeraQuincena);
        const bono_segunda_quincena = calcularBonoQuincena(diasSegundaQuincena);

        // 8. Enviar la respuesta completa
        res.json({
            empleado,
            resumen: {
                mes: hoy.format('MMMM [de] YYYY'),
                asistencias: totalAsistencias,
                retardos: totalRetardos,
                faltas: totalFaltas,
                bonos: totalBonos,
                dias: diasDelMes,
                bono_primera_quincena,
                bono_segunda_quincena,
            }
        });

    } catch (error) {
        console.error('POST /portal/consultar error:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
});

module.exports = router;
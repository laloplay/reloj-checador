const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const Usuario = require('./models/Usuario');
const Dispositivo = require('./models/Dispositivo');
const Empleado = require('./models/Empleado');
const Puesto = require('./models/Puesto');
const Sucursal = require('./models/Sucursal');
const Bono = require('./models/Bono');
const Registro = require('./models/Registro');
const DiaFestivo = require('./models/DiaFestivo');
const DiaDescanso = require('./models/DiaDescanso');
const Vacacion = require('./models/Vacacion');
const Permiso = require('./models/Permiso');
const MotivoPermiso = require('./models/MotivoPermiso');
const Comision = require('./models/Comision');
const Deduccion = require('./models/Deduccion');
const NominaRun = require('./models/NominaRun');
const NominaDetalle = require('./models/NominaDetalle');
const { RekognitionClient, IndexFacesCommand, SearchFacesByImageCommand, DeleteFacesCommand } = require("@aws-sdk/client-rekognition");

Dispositivo.belongsTo(Sucursal, { foreignKey: 'sucursalId' });
Sucursal.hasMany(Dispositivo, { foreignKey: 'sucursalId' });
Empleado.hasMany(Registro, { foreignKey: 'employeeId' });
Registro.belongsTo(Empleado, { foreignKey: 'employeeId' });
Empleado.hasMany(DiaDescanso, { foreignKey: 'employeeId' });
DiaDescanso.belongsTo(Empleado, { foreignKey: 'employeeId' });
Empleado.hasMany(Vacacion, { foreignKey: 'employeeId' });
Vacacion.belongsTo(Empleado, { foreignKey: 'employeeId' });
Empleado.hasMany(Permiso, { foreignKey: 'employeeId' });
Permiso.belongsTo(Empleado, { foreignKey: 'employeeId' });
Permiso.belongsTo(MotivoPermiso, { foreignKey: 'motivoId' });
MotivoPermiso.hasMany(Permiso, { foreignKey: 'motivoId' });
Empleado.hasMany(Comision, { foreignKey: 'employeeId' });
Comision.belongsTo(Empleado, { foreignKey: 'employeeId' });
Empleado.hasMany(Deduccion, { foreignKey: 'employeeId' });
Deduccion.belongsTo(Empleado, { foreignKey: 'employeeId' });
NominaRun.hasMany(NominaDetalle, { foreignKey: 'nominaRunId' });
NominaDetalle.belongsTo(NominaRun, { foreignKey: 'nominaRunId' });
NominaDetalle.belongsTo(Empleado, { foreignKey: 'employeeId' });

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const rekognitionClient = new RekognitionClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});
const COLLECTION_ID = 'empleados_reloj_checador';

app.post('/api/devices/verify', async (req, res) => {
  try {
    const { fingerprint } = req.body;
    if (!fingerprint) return res.status(400).json({ error: 'fingerprint es requerido' });
    const device = await Dispositivo.findOne({ 
      where: { fingerprint: fingerprint },
      include: { model: Sucursal, attributes: ['nombre'] }
    });
    if (device) {
      res.json({ 
        isAuthorized: device.status === 'approved', 
        status: device.status, 
        deviceId: device.id,
        sucursalNombre: device.Sucursal?.nombre
      });
    } else {
      res.status(404).json({ status: 'new' });
    }
  } catch (error) {
    console.error("ERROR EN /verify:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

app.post('/api/devices/register', async (req, res) => {
  try {
    const { fingerprint, nombre } = req.body;
    if (!fingerprint || !nombre) {
      return res.status(400).json({ error: 'Fingerprint y nombre son requeridos.' });
    }
    const newDevice = await Dispositivo.create({
      fingerprint,
      nombre: nombre.toUpperCase(),
      status: 'pending'
    });
    const io = req.app.get('socketio');
    if (io) io.emit('new_device_request', newDevice);
    res.status(201).json(newDevice);
  } catch (error) {
    console.error("ERROR EN /register:", error);
    res.status(500).json({ error: "Error al registrar dispositivo." });
  }
});

app.get('/api/devices/pending', async (req, res) => {
  try {
    const pendingDevices = await Dispositivo.findAll({ where: { status: 'pending' }, order: [['createdAt', 'DESC']] });
    res.json(pendingDevices);
  } catch (error) {
    console.error("Error obteniendo dispositivos pendientes:", error);
    res.status(500).json({ error: 'Error al obtener los dispositivos.' });
  }
});

app.get('/api/devices/approved', async (req, res) => {
  try {
    const devices = await Dispositivo.findAll({ 
      where: { status: 'approved' },
      include: { model: Sucursal, attributes: ['nombre'] },
      order: [['createdAt', 'DESC']] 
    });
    res.json(devices);
  } catch (error) {
    console.error("Error obteniendo dispositivos aprobados:", error);
    res.status(500).json({ error: 'Error al obtener los dispositivos.' });
  }
});

app.get('/api/devices/rejected', async (req, res) => {
  try {
    const devices = await Dispositivo.findAll({ 
      where: { status: 'rejected' },
      order: [['createdAt', 'DESC']] 
    });
    res.json(devices);
  } catch (error) {
    console.error("Error obteniendo dispositivos rechazados:", error);
    res.status(500).json({ error: 'Error al obtener los dispositivos.' });
  }
});

app.post('/api/devices/approve', async (req, res) => {
  try {
    const { id, sucursalId } = req.body;
    const device = await Dispositivo.findByPk(id);
    if (device) {
      device.status = 'approved';
      device.sucursalId = sucursalId;
      await device.save();
      res.json({ success: true, message: `Dispositivo ${id} aprobado.` });
    } else {
      res.status(404).json({ success: false, message: 'Dispositivo no encontrado.' });
    }
  } catch (error) {
    console.error("Error aprobando dispositivo:", error);
    res.status(500).json({ error: 'Error al aprobar el dispositivo.' });
  }
});

app.post('/api/devices/reject', async (req, res) => {
  try {
    const { id } = req.body;
    const device = await Dispositivo.findByPk(id);
    if (device) {
      device.status = 'rejected';
      device.sucursalId = null; 
      await device.save();
      res.json({ success: true, message: `Dispositivo ${id} rechazado.` });
    } else {
      res.status(404).json({ success: false, message: 'Dispositivo no encontrado.' });
    }
  } catch (error) {
    console.error("Error rechazando dispositivo:", error);
    res.status(500).json({ error: 'Error al rechazar.' });
  }
});

app.post('/api/devices/set-pending', async (req, res) => {
  try {
    const { id } = req.body;
    const device = await Dispositivo.findByPk(id);
    if (device) {
      device.status = 'pending';
      device.sucursalId = null;
      await device.save();
      res.json({ success: true, message: `Dispositivo ${id} movido a pendientes.` });
    } else {
      res.status(404).json({ success: false, message: 'Dispositivo no encontrado.' });
    }
  } catch (error) {
    console.error("Error moviendo a pendientes:", error);
    res.status(500).json({ error: 'Error al mover a pendientes.' });
  }
});

app.post('/api/employees', async (req, res) => {
  try {
    const { nombre, sucursal, puesto, salario, bono, fechaIngreso, horaEntrada, horaSalida } = req.body;
    if (!nombre) {
      return res.status(400).json({ error: 'El nombre es requerido.' });
    }
    const nuevoEmpleado = await Empleado.create({
      nombre, sucursal, puesto, salario, bono, fechaIngreso, horaEntrada, horaSalida
    });
    res.status(201).json(nuevoEmpleado);
  } catch (error) {
    console.error("Error creando empleado:", error);
    res.status(500).json({ error: 'Error al crear el empleado.' });
  }
});

app.post('/api/employees/:employeeId/register-face', async (req, res) => {
  const { employeeId } = req.params;
  const { image } = req.body;
  const imageBuffer = Buffer.from(image.replace(/^data:image\/jpeg;base64,/, ""), 'base64');
  try {
    const command = new IndexFacesCommand({
      CollectionId: COLLECTION_ID,
      Image: { Bytes: imageBuffer },
      ExternalImageId: employeeId.toString(),
      MaxFaces: 1,
      QualityFilter: "AUTO",
    });
    await rekognitionClient.send(command);
    res.json({ success: true, message: `Cara del empleado ${employeeId} registrada.` });
  } catch (error) {
    console.error("Error registrando cara:", error);
    res.status(500).json({ error: 'Error en el servidor de reconocimiento.' });
  }
});

app.get('/api/employees', async (req, res) => {
  try {
    const { sucursal } = req.query;
    let whereClause = {};
    if (sucursal && sucursal !== 'TODAS') {
      whereClause.sucursal = sucursal;
    }
    
    const employees = await Empleado.findAll({ 
      where: whereClause,
      order: [['nombre', 'ASC']] 
    });
    res.json(employees);
  } catch (error) {
    console.error("Error obteniendo empleados:", error);
    res.status(500).json({ error: 'Error al obtener empleados.' });
  }
});

app.put('/api/employees/:id', async (req, res) => {
  try {
    const employee = await Empleado.findByPk(req.params.id);
    if (!employee) {
      return res.status(404).json({ error: 'Empleado no encontrado' });
    }
    await employee.update(req.body);
    res.json(employee);
  } catch (error) {
    console.error("Error actualizando empleado:", error);
    res.status(500).json({ error: 'Error al actualizar empleado.' });
  }
});

app.delete('/api/employees/:id', async (req, res) => {
  try {
    const employee = await Empleado.findByPk(req.params.id);
    if (!employee) {
      return res.status(404).json({ error: 'Empleado no encontrado' });
    }
    
    try {
      const deleteCommand = new DeleteFacesCommand({
        CollectionId: COLLECTION_ID,
        FaceIds: [employee.id.toString()]
      });
      await rekognitionClient.send(deleteCommand);
    } catch (rekError) {
      console.error("Error borrando cara de Rekognition (pero se continuará):", rekError);
    }

    await employee.destroy();
    res.status(204).send();
  } catch (error) {
    console.error("Error borrando empleado:", error);
    res.status(500).json({ error: 'Error al borrar empleado.' });
  }
});

app.post('/api/attendance/check-in', async (req, res) => {
  const { image, fingerprint, type } = req.body; 
  if (!image || !fingerprint || !type) {
    return res.status(400).json({ error: "Datos incompletos (imagen, fingerprint o tipo)." });
  }
  const imageBuffer = Buffer.from(image.replace(/^data:image\/jpeg;base64,/, ""), 'base64');
  try {
    const device = await Dispositivo.findOne({ 
      where: { fingerprint: fingerprint, status: 'approved' },
      include: { model: Sucursal, attributes: ['nombre'] } 
    });

    if (!device) {
      return res.status(403).json({ success: false, message: 'Dispositivo no autorizado.' });
    }
    if (!device.Sucursal) {
      return res.status(500).json({ success: false, message: 'Error de configuración: El dispositivo no tiene sucursal asignada.' });
    }

    const command = new SearchFacesByImageCommand({
      CollectionId: COLLECTION_ID,
      Image: { Bytes: imageBuffer },
      MaxFaces: 1,
      FaceMatchThreshold: 99.0,
    });
    const data = await rekognitionClient.send(command);

    if (data.FaceMatches && data.FaceMatches.length > 0) {
      const employeeId = data.FaceMatches[0].Face.ExternalImageId;
      const employee = await Empleado.findByPk(parseInt(employeeId));
      
      if (!employee) {
        return res.status(404).json({ success: false, message: 'Empleado no encontrado en la BD.' });
      }

      if (device.Sucursal.nombre !== employee.sucursal) {
        return res.status(403).json({ 
          success: false, 
          message: `Acceso Denegado: Este dispositivo es de ${device.Sucursal.nombre}, pero tú perteneces a ${employee.sucursal}.` 
        });
      }

      const lastRegistration = await Registro.findOne({
        where: { employeeId: employee.id },
        order: [['timestamp', 'DESC']]
      });

      if (lastRegistration) {
        if (lastRegistration.type === 'ENTRADA' && type === 'ENTRADA') {
          return res.status(400).json({ success: false, message: 'Error: Ya registraste tu ENTRADA.' });
        }
        if (lastRegistration.type === 'SALIDA' && type === 'SALIDA') {
          return res.status(400).json({ success: false, message: 'Error: Ya registraste tu SALIDA.' });
        }
      } else {
        if (type === 'SALIDA') {
          return res.status(400).json({ success: false, message: 'Error: No puedes registrar una SALIDA sin una ENTRADA previa.' });
        }
      }
      
      let statusRegistro = 'PUNTUAL';
      if (type === 'ENTRADA' && employee.horaEntrada) {
        const [he_horas, he_minutos] = employee.horaEntrada.split(':').map(Number);
        const ahora = new Date();
        const horaLimite = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate(), he_horas, he_minutos, 0);
        
        if (ahora > horaLimite) {
          statusRegistro = 'RETARDO';
        }
      }

      await Registro.create({
        employeeId: parseInt(employeeId),
        type: type
      });
      
      res.json({ success: true, employeeName: employee.nombre, type: type, status: statusRegistro });
    } else {
      res.status(404).json({ success: false, message: 'Rostro no reconocido.' });
    }
  } catch (error) {
    console.error("Error en check-in:", error);
    res.status(500).json({ error: "Error al comunicarse con el servicio de reconocimiento." });
  }
});

app.get('/api/puestos', async (req, res) => {
  try { const data = await Puesto.findAll({ order: [['nombre', 'ASC']] }); res.json(data); } 
  catch (error) { res.status(500).json({ error: 'Error al obtener puestos' }); }
});
app.post('/api/puestos', async (req, res) => {
  try { const data = await Puesto.create(req.body); res.status(201).json(data); } 
  catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') return res.status(400).json({ error: `El puesto "${req.body.nombre}" ya existe.` });
    res.status(500).json({ error: 'Error al crear el puesto.' }); 
  }
});
app.put('/api/puestos/:id', async (req, res) => {
  try {
    const item = await Puesto.findByPk(req.params.id);
    if (!item) return res.status(404).json({ error: 'Puesto no encontrado' });
    await item.update(req.body);
    res.json(item);
  } catch (error) { res.status(500).json({ error: 'Error al actualizar' }); }
});
app.delete('/api/puestos/:id', async (req, res) => {
  try {
    const item = await Puesto.findByPk(req.params.id);
    if (!item) return res.status(404).json({ error: 'Puesto no encontrado' });
    await item.destroy();
    res.status(204).send();
  } catch (error) { res.status(500).json({ error: 'Error al borrar' }); }
});

app.get('/api/sucursales', async (req, res) => {
  try { const data = await Sucursal.findAll({ order: [['nombre', 'ASC']] }); res.json(data); }
  catch (error) { res.status(500).json({ error: 'Error al obtener sucursales' }); }
});
app.post('/api/sucursales', async (req, res) => {
  try { const data = await Sucursal.create(req.body); res.status(201).json(data); }
  catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') return res.status(400).json({ error: `La sucursal "${req.body.nombre}" ya existe.` });
    res.status(500).json({ error: 'Error al crear la sucursal.' }); 
  }
});
app.put('/api/sucursales/:id', async (req, res) => {
  try {
    const item = await Sucursal.findByPk(req.params.id);
    if (!item) return res.status(404).json({ error: 'Sucursal no encontrada' });
    await item.update(req.body);
    res.json(item);
  } catch (error) { res.status(500).json({ error: 'Error al actualizar' }); }
});
app.delete('/api/sucursales/:id', async (req, res) => {
  try {
    const item = await Sucursal.findByPk(req.params.id);
    if (!item) return res.status(404).json({ error: 'Sucursal no encontrada' });
    await item.destroy();
    res.status(204).send();
  } catch (error) { res.status(500).json({ error: 'Error al borrar' }); }
});

app.get('/api/bonos', async (req, res) => {
  try { const data = await Bono.findAll({ order: [['nombre', 'ASC']] }); res.json(data); } 
  catch (error) { res.status(500).json({ error: 'Error al obtener bonos' }); }
});
app.post('/api/bonos', async (req, res) => {
  try { 
    const { nombre, monto, tipo_condicion, valor_condicion } = req.body;
    const data = await Bono.create({ 
      nombre: nombre.toUpperCase(), 
      monto, 
      tipo_condicion: tipo_condicion || 'NINGUNO', 
      valor_condicion: valor_condicion ? -Math.abs(parseInt(valor_condicion, 10)) : 0
    }); 
    res.status(201).json(data); 
  } 
  catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') return res.status(400).json({ error: `El bono "${req.body.nombre}" ya existe.` });
    res.status(500).json({ error: 'Error al crear el bono.' }); 
  }
});
app.put('/api/bonos/:id', async (req, res) => {
  try {
    const item = await Bono.findByPk(req.params.id);
    if (!item) return res.status(404).json({ error: 'Bono no encontrado' });
    
    const { nombre, monto, tipo_condicion, valor_condicion } = req.body;
    const updatedData = {
      nombre: nombre.toUpperCase(),
      monto: parseFloat(monto),
      tipo_condicion: tipo_condicion || 'NINGUNO',
      valor_condicion: (tipo_condicion !== 'NINGUNO' && valor_condicion) ? -Math.abs(parseInt(valor_condicion, 10)) : 0
    };
    
    await item.update(updatedData);
    res.json(item);
  } catch (error) { res.status(500).json({ error: 'Error al actualizar' }); }
});
app.delete('/api/bonos/:id', async (req, res) => {
  try {
    const item = await Bono.findByPk(req.params.id);
    if (!item) return res.status(404).json({ error: 'Bono no encontrado' });
    await item.destroy();
    res.status(204).send();
  } catch (error) { res.status(500).json({ error: 'Error al borrar' }); }
});

app.get('/api/registros', async (req, res) => {
  try {
    const { employeeId, startDate, endDate } = req.query;

    if (!employeeId || !startDate || !endDate) {
      return res.status(400).json({ error: 'Faltan parámetros (empleado, fecha inicio o fecha fin).' });
    }

    const [empleado, registros, diasFestivos, vacaciones, permisos] = await Promise.all([
      Empleado.findByPk(employeeId, {
        include: [{ model: DiaDescanso, attributes: ['dia_semana'] }]
      }),
      Registro.findAll({
        where: {
          employeeId: employeeId,
          timestamp: { [Op.between]: [new Date(startDate), new Date(new Date(endDate).getTime() + 86400000)] } 
        },
        order: [['timestamp', 'ASC']]
      }),
      DiaFestivo.findAll({
        where: { fecha: { [Op.between]: [startDate, endDate] } }
      }),
      Vacacion.findAll({
        where: {
          employeeId: employeeId,
          fecha_inicio: { [Op.lte]: endDate },
          fecha_fin: { [Op.gte]: startDate }
        }
      }),
      Permiso.findAll({
        where: {
          employeeId: employeeId,
          fecha_inicio: { [Op.lte]: endDate },
          fecha_fin: { [Op.gte]: startDate }
        },
        include: [{ model: MotivoPermiso, attributes: ['nombre'] }]
      })
    ]);

    if (!empleado) {
      return res.status(404).json({ error: 'Empleado no encontrado.' });
    }

    const diasDescansoSet = new Set(empleado.DiaDescansos.map(d => d.dia_semana));
    const diasFestivosSet = new Set(diasFestivos.map(d => d.fecha));
    
    const registrosMap = new Map();
    for (const reg of registros) {
      const fecha = new Date(reg.timestamp).toISOString().split('T')[0];
      const hora = new Date(reg.timestamp).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
      
      if (!registrosMap.has(fecha)) {
        registrosMap.set(fecha, {});
      }
      
      const diaRegistros = registrosMap.get(fecha);
      if (reg.type === 'ENTRADA' && !diaRegistros.entrada) {
        diaRegistros.entrada = hora;
      } else if (reg.type === 'SALIDA') {
        diaRegistros.salida = hora;
      }
    }

    const reporte = [];
    const fechaInicio = new Date(`${startDate}T12:00:00Z`);
    const fechaFin = new Date(`${endDate}T12:00:00Z`);

    for (let d = new Date(fechaInicio); d <= fechaFin; d.setUTCDate(d.getUTCDate() + 1)) {
      const fechaActualISO = d.toISOString().split('T')[0];
      const diaSemana = d.getUTCDay();
      
      let diaReporte = {
        fecha: fechaActualISO,
        status: 'FALTA',
        entrada: '--',
        salida: '--'
      };

      if (diasFestivosSet.has(fechaActualISO)) {
        diaReporte.status = 'FEST';
      }
      else if (diasDescansoSet.has(diaSemana)) {
        diaReporte.status = 'DESC';
      }
      else if (vacaciones.some(v => fechaActualISO >= v.fecha_inicio && fechaActualISO <= v.fecha_fin)) {
        diaReporte.status = 'VAC';
      }
      else {
        const permisoHoy = permisos.find(p => fechaActualISO >= p.fecha_inicio && fechaActualISO <= p.fecha_fin);
        if (permisoHoy) {
          diaReporte.status = permisoHoy.MotivoPermiso ? permisoHoy.MotivoPermiso.nombre.substring(0, 4).toUpperCase() : 'PERM';
        }
      }

      if (diaReporte.status === 'FALTA') {
        const registroDelDia = registrosMap.get(fechaActualISO);
        if (registroDelDia && registroDelDia.entrada) {
          diaReporte.status = 'OK';
          diaReporte.entrada = registroDelDia.entrada;
          diaReporte.salida = registroDelDia.salida || '--';
        }
      }
      
      reporte.push(diaReporte);
    }

    res.json({ empleado, reporte });

  } catch (error) {
    console.error("Error generando reporte:", error);
    res.status(500).json({ error: 'Error al generar el reporte.' });
  }
});

app.get('/api/registros-sucursal', async (req, res) => {
  try {
    const { sucursal } = req.query;
    if (!sucursal) {
      return res.status(400).json({ error: 'Se requiere el nombre de la sucursal.' });
    }

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const empleados = await Empleado.findAll({ 
      where: { sucursal: sucursal }, 
      attributes: ['id'] 
    });

    if (empleados.length === 0) {
      return res.json([]);
    }

    const employeeIds = empleados.map(e => e.id);

    const registros = await Registro.findAll({ 
      where: { 
        employeeId: { [Op.in]: employeeIds },
        timestamp: { [Op.between]: [startOfDay, endOfDay] }
      }, 
      include: { 
        model: Empleado, 
        attributes: ['nombre'] 
      }, 
      order: [['timestamp', 'DESC']] 
    });
    
    res.json(registros);
  } catch (error) {
    console.error("Error obteniendo registros de sucursal:", error);
    res.status(500).json({ error: 'Error al obtener los registros.' });
  }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Usuario y contraseña son requeridos.' });
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await Usuario.create({ username: username.toLowerCase(), password: hashedPassword, role: 'admin' });
    res.status(201).json({ message: 'Administrador creado con éxito', userId: newUser.id });
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') return res.status(400).json({ error: `El usuario "${req.body.username}" ya existe.` });
    res.status(500).json({ error: 'Error al registrar administrador.' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await Usuario.findOne({ where: { username: username.toLowerCase() } });
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado.' });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: 'Contraseña incorrecta.' });
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET || 'TU_CLAVE_SECRETA_SUPER_DIFICIL_CAMBIAME',
      { expiresIn: '8h' }
    );
    res.json({ message: 'Inicio de sesión exitoso', token, role: user.role });
  } catch (error) {
    console.error("Error en login:", error);
    res.status(500).json({ error: 'Error en el servidor durante el login.' });
  }
});

app.get('/api/dias-festivos', async (req, res) => {
  try {
    const dias = await DiaFestivo.findAll({ order: [['fecha', 'ASC']] });
    res.json(dias);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener días festivos' });
  }
});

app.post('/api/dias-festivos', async (req, res) => {
  try {
    const { fecha, nombre } = req.body;
    const nuevoDia = await DiaFestivo.create({ fecha, nombre: nombre.toUpperCase() });
    res.status(201).json(nuevoDia);
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ error: 'Esa fecha ya está registrada.' });
    }
    res.status(500).json({ error: 'Error al crear el día festivo.' });
  }
});

app.delete('/api/dias-festivos/:id', async (req, res) => {
  try {
    const item = await DiaFestivo.findByPk(req.params.id);
    if (!item) return res.status(404).json({ error: 'Día no encontrado' });
    await item.destroy();
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Error al borrar el día festivo.' });
  }
});

app.get('/api/dias-descanso', async (req, res) => {
  try {
    const { sucursal } = req.query;
    let whereClause = {};
    if (sucursal && sucursal !== 'TODAS') {
      whereClause.sucursal = sucursal;
    }
    const empleados = await Empleado.findAll({
      attributes: ['id', 'nombre', 'sucursal'],
      where: whereClause,
      include: {
        model: DiaDescanso,
        attributes: ['dia_semana']
      },
      order: [['nombre', 'ASC']]
    });
    res.json(empleados);
  } catch (error) {
    console.error("Error obteniendo días de descanso:", error);
    res.status(500).json({ error: 'Error al obtener los datos.' });
  }
});

app.post('/api/dias-descanso/toggle', async (req, res) => {
  try {
    const { employeeId, dia_semana, isChecked } = req.body;
    if (isChecked) {
      await DiaDescanso.findOrCreate({
        where: { 
          employeeId: employeeId, 
          dia_semana: dia_semana
        }
      });
      res.status(201).json({ message: 'Día de descanso añadido.' });
    } else {
      await DiaDescanso.destroy({
        where: { 
          employeeId: employeeId, 
          dia_semana: dia_semana
        }
      });
      res.status(200).json({ message: 'Día de descanso eliminado.' });
    }
  } catch (error) {
    console.error("Error guardando día de descanso:", error);
    res.status(500).json({ error: 'Error al guardar.' });
  }
});

app.get('/api/vacaciones', async (req, res) => {
  try {
    const { sucursal } = req.query;
    let includeWhere = {};
    if (sucursal && sucursal !== 'TODAS') {
      includeWhere.sucursal = sucursal;
    }
    const vacaciones = await Vacacion.findAll({
      include: [{
        model: Empleado,
        attributes: ['nombre', 'sucursal'],
        where: includeWhere
      }],
      order: [['fecha_inicio', 'DESC']]
    });
    res.json(vacaciones);
  } catch (error) {
    console.error("Error obteniendo vacaciones:", error);
    res.status(500).json({ error: 'Error al obtener los datos.' });
  }
});

app.post('/api/vacaciones', async (req, res) => {
  try {
    const { employeeId, fecha_inicio, fecha_fin } = req.body;
    if (!employeeId || !fecha_inicio || !fecha_fin) {
      return res.status(400).json({ error: 'Todos los campos son requeridos.' });
    }
    const nuevasVacaciones = await Vacacion.create({ employeeId, fecha_inicio, fecha_fin });
    res.status(201).json(nuevasVacaciones);
  } catch (error) {
    console.error("Error guardando vacaciones:", error);
    res.status(500).json({ error: 'Error al guardar.' });
  }
});

app.delete('/api/vacaciones/:id', async (req, res) => {
  try {
    const item = await Vacacion.findByPk(req.params.id);
    if (!item) return res.status(404).json({ error: 'Registro de vacación no encontrado.' });
    await item.destroy();
    res.status(204).send();
  } catch (error) {
    console.error("Error borrando vacación:", error);
    res.status(500).json({ error: 'Error al borrar.' });
  }
});

app.get('/api/motivos-permiso', async (req, res) => {
  try {
    const motivos = await MotivoPermiso.findAll({ order: [['nombre', 'ASC']] });
    res.json(motivos);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener motivos.' });
  }
});

app.post('/api/motivos-permiso', async (req, res) => {
  try {
    const { nombre } = req.body;
    const nuevoMotivo = await MotivoPermiso.create({ nombre: nombre.toUpperCase() });
    res.status(201).json(nuevoMotivo);
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ error: 'Ese motivo ya existe.' });
    }
    res.status(500).json({ error: 'Error al crear el motivo.' });
  }
});

app.delete('/api/motivos-permiso/:id', async (req, res) => {
  try {
    const item = await MotivoPermiso.findByPk(req.params.id);
    if (!item) return res.status(404).json({ error: 'Motivo no encontrado.' });
    await item.destroy();
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Error al borrar el motivo.' });
  }
});

app.get('/api/permisos', async (req, res) => {
  try {
    const { sucursal } = req.query;
    let includeWhere = {};
    if (sucursal && sucursal !== 'TODAS') {
      includeWhere.sucursal = sucursal;
    }
    
    const permisos = await Permiso.findAll({
      include: [
        {
          model: Empleado,
          attributes: ['nombre', 'sucursal'],
          where: includeWhere
        },
        {
          model: MotivoPermiso,
          attributes: ['nombre']
        }
      ],
      order: [['fecha_inicio', 'DESC']]
    });
    res.json(permisos);
  } catch (error) {
    console.error("Error obteniendo permisos:", error);
    res.status(500).json({ error: 'Error al obtener los datos.' });
  }
});

app.post('/api/permisos', async (req, res) => {
  try {
    const { employeeId, fecha_inicio, fecha_fin, motivoId } = req.body;
    if (!employeeId || !fecha_inicio || !fecha_fin || !motivoId) {
      return res.status(404).json({ error: 'Todos los campos son requeridos.' });
    }
    const nuevoPermiso = await Permiso.create({ employeeId, fecha_inicio, fecha_fin, motivoId });
    res.status(201).json(nuevoPermiso);
  } catch (error) {
    console.error("Error guardando permiso:", error);
    res.status(500).json({ error: 'Error al guardar.' });
  }
});

app.delete('/api/permisos/:id', async (req, res) => {
  try {
    const item = await Permiso.findByPk(req.params.id);
    if (!item) return res.status(404).json({ error: 'Registro de permiso no encontrado.' });
    await item.destroy();
    res.status(204).send();
  } catch (error) {
    console.error("Error borrando permiso:", error);
    res.status(500).json({ error: 'Error al borrar.' });
  }
});

app.get('/api/admin/users', async (req, res) => {
  try {
    const users = await Usuario.findAll({ 
      attributes: ['id', 'username', 'role'],
      order: [['username', 'ASC']] 
    });
    res.json(users);
  } catch (error) {
    console.error("Error obteniendo administradores:", error);
    res.status(500).json({ error: 'Error al obtener administradores.' });
  }
});

app.delete('/api/admin/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userToDelete = await Usuario.findByPk(id);
    
    if (!userToDelete) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }

    const adminCount = await Usuario.count({ where: { role: 'admin' } });

    if (adminCount <= 1) {
      return res.status(400).json({ error: 'No se puede eliminar al último administrador.' });
    }

    await userToDelete.destroy();
    res.status(204).send();
  } catch (error) {
    console.error("Error borrando administrador:", error);
    res.status(500).json({ error: 'Error al borrar administrador.' });
  }
});

app.get('/api/incidencias/comisiones', async (req, res) => {
  try {
    const data = await Comision.findAll({ include: [Empleado], order: [['fecha_pago', 'DESC']] });
    res.json(data);
  } catch (error) { res.status(500).json({ error: 'Error al obtener comisiones' }); }
});
app.post('/api/incidencias/comisiones', async (req, res) => {
  try {
    const data = await Comision.create(req.body);
    res.status(201).json(data);
  } catch (error) { res.status(500).json({ error: 'Error al crear comisión' }); }
});
app.delete('/api/incidencias/comisiones/:id', async (req, res) => {
  try {
    await Comision.destroy({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (error) { res.status(500).json({ error: 'Error al borrar comisión' }); }
});

app.get('/api/incidencias/deducciones', async (req, res) => {
  try {
    const data = await Deduccion.findAll({ include: [Empleado], order: [['fecha_pago', 'DESC']] });
    res.json(data);
  } catch (error) { res.status(500).json({ error: 'Error al obtener deducciones' }); }
});
app.post('/api/incidencias/deducciones', async (req, res) => {
  try {
    const data = await Deduccion.create(req.body);
    res.status(201).json(data);
  } catch (error) { res.status(500).json({ error: 'Error al crear deducción' }); }
});
app.delete('/api/incidencias/deducciones/:id', async (req, res) => {
  try {
    await Deduccion.destroy({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (error) { res.status(500).json({ error: 'Error al borrar deducción' }); }
});

app.post('/api/nomina/calcular', async (req, res) => {
  try {
    const { fecha_inicio, fecha_fin } = req.body;
    const startDate = new Date(fecha_inicio);
    const endDate = new Date(fecha_fin);
    
    const [empleados, registros, diasFestivos, vacaciones, permisos, bonosCondicionales, comisiones, deducciones] = await Promise.all([
      Empleado.findAll({ include: [DiaDescanso] }),
      Registro.findAll({ where: { timestamp: { [Op.between]: [startDate, new Date(endDate.getTime() + 86400000)] } } }),
      DiaFestivo.findAll({ where: { fecha: { [Op.between]: [fecha_inicio, fecha_fin] } } }),
      Vacacion.findAll({ where: { fecha_inicio: { [Op.lte]: fecha_fin }, fecha_fin: { [Op.gte]: fecha_inicio } } }),
      Permiso.findAll({ where: { fecha_inicio: { [Op.lte]: fecha_fin }, fecha_fin: { [Op.gte]: fecha_inicio } } }),
      Bono.findAll({ where: { tipo_condicion: { [Op.ne]: 'NINGUNO' } } }),
      Comision.findAll({ where: { fecha_pago: { [Op.between]: [fecha_inicio, fecha_fin] } } }),
      Deduccion.findAll({ where: { fecha_pago: { [Op.between]: [fecha_inicio, fecha_fin] } } })
    ]);

    const diasFestivosSet = new Set(diasFestivos.map(d => d.fecha));
    const nominaCalculada = [];

    for (const emp of empleados) {
      let dias_laborados = 0;
      let bono_puntualidad = 0;

      const diasDescansoSet = new Set(emp.DiaDescansos.map(d => d.dia_semana));
      const registrosEmpleado = registros.filter(r => r.employeeId === emp.id);
      
      const [he_horas, he_minutos] = emp.horaEntrada.split(':').map(Number);
      
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const fechaActualISO = d.toISOString().split('T')[0];
        const diaSemana = d.getDay();

        const esFestivo = diasFestivosSet.has(fechaActualISO);
        const esDescanso = diasDescansoSet.has(diaSemana);
        const esVacacion = vacaciones.some(v => v.employeeId === emp.id && fechaActualISO >= v.fecha_inicio && fechaActualISO <= v.fecha_fin);
        const esPermiso = permisos.some(p => p.employeeId === emp.id && fechaActualISO >= p.fecha_inicio && fechaActualISO <= p.fecha_fin);

        const registrosHoy = registrosEmpleado.filter(r => new Date(r.timestamp).toISOString().split('T')[0] === fechaActualISO);
        const entradaHoy = registrosHoy.find(r => r.type === 'ENTRADA');

        let diaLaborado = false;
        if (entradaHoy) {
          diaLaborado = true;
          dias_laborados++;
        }

        if (diaLaborado && !esFestivo && !esDescanso && !esVacacion && !esPermiso && emp.bono) {
          const bonoPuntual = bonosCondicionales.find(b => b.tipo_condicion === 'PUNTUALIDAD' && b.nombre.toUpperCase() === emp.bono.toUpperCase());
          if (bonoPuntual && emp.horaEntrada) {
            const horaEntradaTS = new Date(entradaHoy.timestamp);
            const horaLimite = new Date(horaEntradaTS.getFullYear(), horaEntradaTS.getMonth(), horaEntradaTS.getDate(), he_horas, he_minutos, 0);
            const minutosLlegada = (horaEntradaTS.getTime() - horaLimite.getTime()) / 60000;
            
            if (minutosLlegada <= bonoPuntual.valor_condicion) {
              bono_puntualidad += bonoPuntual.monto;
            }
          }
        }
      }

      const comisionesEmpleado = comisiones.filter(c => c.employeeId === emp.id).reduce((sum, c) => sum + c.monto, 0);
      const deduccionesEmpleado = deducciones.filter(d => d.employeeId === emp.id).reduce((sum, d) => sum + d.monto, 0);

      const sueldo = emp.salario * dias_laborados;
      const total_percepciones = sueldo + bono_puntualidad + comisionesEmpleado;
      const neto_a_pagar = total_percepciones - deduccionesEmpleado;

      nominaCalculada.push({
        employeeId: emp.id,
        nombre: emp.nombre,
        puesto: emp.puesto,
        rfc: 'PECI750723M30',
        fecha_ingreso: new Date(emp.fechaIngreso).toLocaleDateString('es-MX'),
        dias_laborados,
        salario_diario: emp.salario,
        sueldo,
        bono_puntualidad,
        comision: comisionesEmpleado,
        total_percepciones,
        otras_deducciones: deduccionesEmpleado,
        neto_a_pagar
      });
    }

    res.json(nominaCalculada);
  } catch (error) {
    console.error("Error calculando nómina:", error);
    res.status(500).json({ error: 'Error al calcular la nómina.' });
  }
});

app.get('/api/nomina/runs', async (req, res) => {
  try {
    const runs = await NominaRun.findAll({ order: [['fecha_fin', 'DESC']] });
    res.json(runs);
  } catch (error) { res.status(500).json({ error: 'Error al obtener nóminas guardadas.' }); }
});

app.get('/api/nomina/runs/:id', async (req, res) => {
  try {
    const run = await NominaRun.findByPk(req.params.id);
    if (!run) return res.status(404).json({ error: 'Corrida no encontrada.' });
    
    const detalles = await NominaDetalle.findAll({ 
      where: { nominaRunId: req.params.id }
    });
    res.json({ run, detalles });
  } catch (error) { res.status(500).json({ error: 'Error al obtener detalles.' }); }
});

app.post('/api/nomina/guardar', async (req, res) => {
  try {
    const { nombre, fecha_inicio, fecha_fin, detalles } = req.body;
    
    const newRun = await NominaRun.create({ nombre, fecha_inicio, fecha_fin });
    
    const detallesConId = detalles.map(d => ({
      ...d,
      nominaRunId: newRun.id
    }));
    
    await NominaDetalle.bulkCreate(detallesConId);
    
    res.status(201).json(newRun);
  } catch (error) {
    console.error("Error guardando nómina:", error);
    res.status(500).json({ error: 'Error al guardar.' });
  }
});

module.exports = app;
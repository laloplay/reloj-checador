const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
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
    const device = await Dispositivo.findOne({ where: { fingerprint: fingerprint } });
    if (device) {
      res.json({ isAuthorized: device.status === 'approved', status: device.status, deviceId: device.id });
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

app.post('/api/attendance/check-in', async (req, res) => {
  const { image, fingerprint } = req.body; 
  if (!image || !fingerprint) {
    return res.status(400).json({ error: "Datos incompletos (imagen o fingerprint)." });
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
      FaceMatchThreshold: 98,
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

      await Registro.create({
        employeeId: parseInt(employeeId),
        type: 'ENTRADA'
      });
      
      res.json({ success: true, employeeName: employee.nombre });
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
  try { const data = await Bono.create(req.body); res.status(201).json(data); } 
  catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') return res.status(400).json({ error: `El bono "${req.body.nombre}" ya existe.` });
    res.status(500).json({ error: 'Error al crear el bono.' }); 
  }
});
app.put('/api/bonos/:id', async (req, res) => {
  try {
    const item = await Bono.findByPk(req.params.id);
    if (!item) return res.status(404).json({ error: 'Bono no encontrado' });
    await item.update(req.body);
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
    const registros = await Registro.findAll({
      include: [{ model: Empleado, attributes: ['nombre'] }],
      order: [['timestamp', 'DESC']]
    });
    res.json(registros);
  } catch (error) {
    console.error("Error obteniendo registros:", error);
    res.status(500).json({ error: 'Error al obtener los registros.' });
  }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Usuario y contraseña son requeridos.' });
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await Usuario.create({ username, password: hashedPassword, role: 'admin' });
    res.status(201).json({ message: 'Administrador creado con éxito', userId: newUser.id });
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') return res.status(400).json({ error: `El usuario "${req.body.username}" ya existe.` });
    res.status(500).json({ error: 'Error al registrar administrador.' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await Usuario.findOne({ where: { username } });
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

app.get('/api/employees', async (req, res) => {
  try {
    const employees = await Empleado.findAll({ order: [['nombre', 'ASC']] });
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
    if (sucursal) {
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

module.exports = app;
// backend/src/app.js

// --- IMPORTACIONES ---
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
const { RekognitionClient, IndexFacesCommand, SearchFacesByImageCommand } = require("@aws-sdk/client-rekognition");

// --- CONFIGURACIÓN INICIAL ---
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

// ==========================================
// RUTAS DE LA APP
// ==========================================

// --- Rutas de Dispositivos ---
app.post('/api/devices/verify', async (req, res) => {
  try {
    const { fingerprint } = req.body;
    if (!fingerprint) return res.status(400).json({ error: 'fingerprint es requerido' });

    const [device, created] = await Dispositivo.findOrCreate({
      where: { fingerprint: fingerprint },
      defaults: { status: 'pending' }
    });

    if (created) {
      console.log(`Nuevo dispositivo creado con fingerprint: ${fingerprint}`);
      const io = req.app.get('socketio');
      if (io) io.emit('new_device_request', device);
    }
    res.json({ isAuthorized: device.status === 'approved', status: device.status, deviceId: device.id });
  } catch (error) {
    console.error("ERROR EN /verify:", error);
    res.status(500).json({ error: "Error interno del servidor" });
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

app.post('/api/devices/approve', async (req, res) => {
  try {
    const { id } = req.body;
    const device = await Dispositivo.findByPk(id);
    if (device) {
      device.status = 'approved';
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

// --- Rutas de Empleados y Reconocimiento ---
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
  const { image } = req.body;
  if (!image) return res.status(400).json({ error: "No se recibió ninguna imagen." });
  
  const imageBuffer = Buffer.from(image.replace(/^data:image\/jpeg;base64,/, ""), 'base64');

  try {
    const command = new SearchFacesByImageCommand({
      CollectionId: COLLECTION_ID,
      Image: { Bytes: imageBuffer },
      MaxFaces: 1,
      FaceMatchThreshold: 98,
    });
    
    const data = await rekognitionClient.send(command);

    if (data.FaceMatches && data.FaceMatches.length > 0) {
      const employeeId = data.FaceMatches[0].Face.ExternalImageId;
      
      await Registro.create({
        employeeId: parseInt(employeeId),
        type: 'ENTRADA' // Lógica simple por ahora
      });
      console.log(`✅ Registro de ENTRADA guardado para empleado ID: ${employeeId}.`);
      
      res.json({ success: true, employeeId });
    } else {
      res.status(404).json({ success: false, message: 'Rostro no reconocido.' });
    }
  } catch (error) {
    console.error("Error en check-in:", error);
    res.status(500).json({ error: "Error al comunicarse con el servicio de reconocimiento." });
  }
});

// --- RUTAS DE GESTIÓN (PUESTOS, SUCURSALES, BONOS) ---
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

// --- RUTA PARA VER REGISTROS ---
app.get('/api/registros', async (req, res) => {
  try {
    const registros = await Registro.findAll({
      include: [{
        model: Empleado,
        attributes: ['nombre']
      }],
      order: [['timestamp', 'DESC']]
    });
    res.json(registros);
  } catch (error) {
    console.error("Error obteniendo registros:", error);
    res.status(500).json({ error: 'Error al obtener los registros.' });
  }
});

// --- RUTAS DE AUTENTICACIÓN ---
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
      'TU_CLAVE_SECRETA_SUPER_DIFICIL_CAMBIAME',
      { expiresIn: '8h' }
    );
    res.json({ message: 'Inicio de sesión exitoso', token, role: user.role });
  } catch (error) {
    res.status(500).json({ error: 'Error en el servidor durante el login.' });
  }
});


// ==========================================
// EXPORTAR LA APP
// ==========================================
module.exports = app;


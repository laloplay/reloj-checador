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

// ==========================================
// ASOCIACIONES DE LA BASE DE DATOS
// Aquí definimos todas las relaciones en un solo lugar.
// ==========================================
Dispositivo.belongsTo(Sucursal, { foreignKey: 'sucursalId' });
Sucursal.hasMany(Dispositivo, { foreignKey: 'sucursalId' });

Empleado.hasMany(Registro, { foreignKey: 'employeeId' });
Registro.belongsTo(Empleado, { foreignKey: 'employeeId' });
// ==========================================

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
  console.log("\n---");
  console.log("A1. ✅ Petición recibida en /api/attendance/check-in");
  const { image, fingerprint } = req.body; 

  if (!image) {
    console.log("A2. ❌ Error: No se recibió imagen.");
    return res.status(400).json({ error: "Datos incompletos (imagen o fingerprint)." });
  }
  if (!fingerprint) {
    console.log("A2. ❌ Error: No se recibió fingerprint del dispositivo.");
    return res.status(400).json({ error: "Datos incompletos (imagen o fingerprint)." });
  }
  console.log("A2. 👍 Imagen y Fingerprint recibidos.");

  const imageBuffer = Buffer.from(image.replace(/^data:image\/jpeg;base64,/, ""), 'base64');
  console.log("A3. 🔄 Imagen convertida a formato binario (Buffer).");

  try {
    // Paso 1: Verificar el dispositivo y su sucursal
    console.log("A4. 🔍 Verificando dispositivo en la BD...");
    const device = await Dispositivo.findOne({ 
      where: { fingerprint: fingerprint, status: 'approved' },
      include: { model: Sucursal, attributes: ['nombre'] } 
    });
    console.log("A4.1. 👍 Verificación de dispositivo terminada.");

    if (!device) {
      console.log("A5. ❌ Error: Dispositivo no autorizado.");
      return res.status(403).json({ success: false, message: 'Dispositivo no autorizado.' });
    }
    
    if (!device.Sucursal) {
      console.log("A5. ❌ Error: Dispositivo aprobado pero no tiene sucursal asignada.");
      return res.status(500).json({ success: false, message: 'Error de configuración: El dispositivo no tiene sucursal asignada.' });
    }
    console.log("A5. 👍 Dispositivo autorizado. Pertenece a la sucursal:", device.Sucursal.nombre);

    // Paso 2: Enviar foto a AWS Rekognition para reconocimiento
    console.log("A6. 📡 Enviando foto a AWS Rekognition para análisis...");
    const command = new SearchFacesByImageCommand({
      CollectionId: COLLECTION_ID,
      Image: { Bytes: imageBuffer },
      MaxFaces: 1,
      FaceMatchThreshold: 98,
    });
    const data = await rekognitionClient.send(command);
    console.log("A7. 👍 Respuesta recibida de AWS Rekognition.");

    if (data.FaceMatches && data.FaceMatches.length > 0) {
      const employeeId = data.FaceMatches[0].Face.ExternalImageId;
      console.log(`A8. 🟢 ¡Éxito! Rostro reconocido para empleado ID: ${employeeId}.`);

      // Paso 3: Verificar al empleado y comparar sucursales
      console.log("A9. 🔍 Verificando empleado y sucursal en la BD...");
      const employee = await Empleado.findByPk(parseInt(employeeId));
      if (!employee) {
        console.log("A10. ❌ Error: Empleado reconocido por AWS pero no encontrado en la BD.");
        return res.status(404).json({ success: false, message: 'Empleado no encontrado en la BD.' });
      }
      console.log(`A10. 👍 Empleado encontrado: ${employee.nombre}. Sucursal del Empleado: ${employee.sucursal}`);

      if (device.Sucursal.nombre !== employee.sucursal) {
        console.log("A11. ❌ Acceso Denegado: Sucursal no coincide.");
        return res.status(403).json({ 
          success: false, 
          message: `Acceso Denegado: Este dispositivo es de ${device.Sucursal.nombre}, pero tú perteneces a ${employee.sucursal}.` 
        });
      }
      console.log("A11. 👍 Sucursales coinciden.");

      // Paso 4: Guardar el registro de asistencia
      console.log("A12. 💾 Guardando registro en la BD...");
      await Registro.create({
        employeeId: parseInt(employeeId),
        type: 'ENTRADA'
      });
      console.log("A13. ✅ Registro guardado con éxito.");
      
      // Paso 5: Enviar respuesta exitosa con el nombre del empleado
      console.log("A14. 📤 Enviando respuesta final al frontend..."); // <-- NUEVO LOG
      res.json({ success: true, employeeName: employee.nombre });
      console.log("A15. 🏁 ¡Respuesta enviada!"); // <-- NUEVO LOG

    } else {
      console.log("A8. 🟡 No se encontraron coincidencias en AWS.");
      res.status(404).json({ success: false, message: 'Rostro no reconocido.' });
    }
  } catch (error) {
    console.error("🔥🔥🔥 ¡ERROR CATASTRÓFICO EN /check-in! 🔥🔥🔥", error);
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

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use('/audio', express.static(path.join(__dirname, 'audio-cache')));

const authRoutes = require('./routes/auth');
const checadasRoutes = require('./routes/checadas');
const dispositivosRoutes = require('./routes/dispositivos');
const empleadosRoutes = require('./routes/empleados');
const reportesRoutes = require('./routes/reportes');
const registrosRoutes = require('./routes/registros');
const festivosRoutes = require('./routes/festivos');
const ausenciasRoutes = require('./routes/ausencias');
const mantenimientoRoutes = require('./routes/mantenimiento');
const solicitudesRoutes = require('./routes/solicitudes');
const turnosRoutes = require('./routes/turnos');
const sucursalesRoutes = require('./routes/sucursales');
const puestosRoutes = require('./routes/puestos');
const nominaRoutes = require('./routes/nomina');
const portalRoutes = require('./routes/portal');

app.use('/api/auth', authRoutes);
app.use('/api/checadas', checadasRoutes);
app.use('/api/dispositivos', dispositivosRoutes);
app.use('/api/empleados', empleadosRoutes); 
app.use('/api/reportes', reportesRoutes);
app.use('/api/registros', registrosRoutes);
app.use('/api/festivos', festivosRoutes);
app.use('/api/ausencias', ausenciasRoutes);
app.use('/api/mantenimiento', mantenimientoRoutes);
app.use('/api/solicitudes-correccion', solicitudesRoutes);
app.use('/api/turnos', turnosRoutes);
app.use('/api/sucursales', sucursalesRoutes);
app.use('/api/puestos', puestosRoutes);
app.use('/api/nomina', nominaRoutes);
app.use('/api/portal', portalRoutes);

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Servidor en funcionamiento en el puerto ${PORT}`);
});

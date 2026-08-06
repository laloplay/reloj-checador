const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER || 'laloplay',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'reloj_checador',
  password: process.env.DB_PASSWORD || 'tu_password_local',
  port: process.env.DB_PORT || 5432,
});

// --- INICIO DE LA CORRECCIÓN ---
// Este es el cambio clave. Cada vez que se establece una nueva conexión
// con la base de datos, se ejecuta este comando para establecer la zona horaria
// correcta para la sesión.
pool.on('connect', (client) => {
  // Usa la variable de entorno PGTZ. Si no existe, usa 'UTC' como fallback.
  client.query(`SET TIME ZONE '${process.env.PGTZ || 'UTC'}'`);
});

module.exports = pool;
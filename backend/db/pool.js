const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER || 'laloplay',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'reloj_checador',
  password: process.env.DB_PASSWORD || 'tu_password_local',
  port: process.env.DB_PORT || 5432,
});

// Mantiene la misma zona horaria del negocio en todas las conexiones a Postgres.
// Esto evita que en producción las fechas se interpreten en UTC mientras el resto
// de la aplicación espera hora local.
pool.on('connect', (client) => {
  const timeZone = process.env.PGTZ || 'America/Mexico_City';
  client.query(`SET TIME ZONE '${timeZone}'`);
});

module.exports = pool;
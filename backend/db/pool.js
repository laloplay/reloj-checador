const { Pool } = require('pg');

const rawTimeZone = process.env.PGTZ || 'America/Mexico_City';
const safeTimeZone = /^[A-Za-z_\/]+$/.test(rawTimeZone) ? rawTimeZone : 'America/Mexico_City';

const pool = new Pool({
  user: process.env.DB_USER || 'laloplay',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'reloj_checador',
  password: process.env.DB_PASSWORD || 'tu_password_local',
  port: process.env.DB_PORT || 5432,
  // Evita ejecutar una query extra por conexión y elimina la advertencia de pg@9.
  options: `-c timezone=${safeTimeZone}`,
});

module.exports = pool;
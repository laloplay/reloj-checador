const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER || 'laloplay',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'reloj_checador',
  password: process.env.DB_PASSWORD || 'tu_password_local',
  port: process.env.DB_PORT || 5432,
});
module.exports = pool;
const { Pool } = require('pg');
const migrate = require('node-pg-migrate').default;

const runMigrations = async () => {
  const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
  });

  const client = await pool.connect();
  console.log('Conectado a la base de datos para ejecutar migraciones.');

  try {
    console.log('Iniciando proceso de migración...');
    await migrate({
      dbClient: client,
      dir: 'migrations',
      direction: 'up',
      migrationsTable: 'pgmigrations',
      verbose: true,
    });
    console.log('✅ Migraciones completadas exitosamente.');
  } catch (error) {
    console.error('❌ FATAL: La migración de la base de datos falló.', error);
    throw error; // Lanzamos el error para detener el inicio del servidor.
  } finally {
    await client.release();
    await pool.end();
    console.log('Cliente de migración desconectado.');
  }
};

module.exports = { runMigrations };

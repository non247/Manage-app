require('dotenv').config();
const { Pool } = require('pg');

const isProduction = !!process.env.DATABASE_URL;

const pool = new Pool(
  isProduction
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: false,
      }
    : {
        host: 'localhost',
        user: 'postgres',
        port: 5432,
        password: '1234',
        database: 'CompanyDB',
      }
);

pool.on('connect', () => {
  console.log('✅ PostgreSQL connected');
});

pool.on('error', (err) => {
  console.error('❌ PostgreSQL error:', err);
});

module.exports = pool;
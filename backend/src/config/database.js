const { Pool } = require('pg');

const isProduction = process.env.DATABASE_URL;

const pool = new Pool(
  isProduction
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
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
  console.log('PostgreSQL connected');
});

module.exports = pool;
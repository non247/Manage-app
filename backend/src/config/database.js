// const { Client } = require('pg');
// const express= require('express');

// const app = express()
// app.use(express.json())

// const client = new Client({
//   host: 'localhost',
//   user: 'postgres',
//   port: 5432,
//   password: '1234',
//   database: 'CompanyDB'
// });

// client.connect()
//   .then(() => console.log("connect"))
//   .catch(err => console.error("connection error", err));

// app.post('/postData',(req,res)=>{

  
// })


const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  user: 'postgres',
  port: 5432,
  password: '1234',
  database: 'CompanyDB'
});

pool.on('connect', () => {
  console.log('PostgreSQL connected');
});

module.exports = pool;



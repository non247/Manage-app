// const sql = require("express"); 
// const { Client } = require('pg');

// const client = new Client({
//   host: 'localhost',
//   port: 5432,
//   user: 'postgres',
//   password: '1234',
//   database: 'CompanyDB'
// });

// client.connect();

// client.query('SELECT NOW()', (err, res) => {
//   console.log(res.rows);
//   client.end();
// });

const { Client } = require('pg');
const express= require('express');

const app = express()
app.use(express.json())

const client = new Client({
  host: 'localhost',
  user: 'postgres',
  port: 5432,
  password: '1234',
  database: 'CompanyDB'
});

client.connect()
  .then(() => console.log("connect"))
  .catch(err => console.error("connection error", err));

app.post('/postData',(req,res)=>{

  
})


// client.connect()
//   .then(async () => {
//     console.log('✅ PostgreSQL connected');

//     // 🔍 QUERY ตรวจสอบว่าต่อ DB ไหน / user ไหน / host อะไร
//     const result = await client.query(`
//       SELECT 
//         current_database() AS db,
//         current_user AS user,
//         inet_server_addr() AS host,
//         inet_server_port() AS port
//     `);

//     console.log(result.rows);

//     client.end();
//   })
//   .catch(err => console.error('❌ Connection error', err));


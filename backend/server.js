const express = require('express');
const cors = require('cors');

//นำเข้าroutesทุกroutesที่ใช้ในการรับส่งข้อมูล
const Dashboard = require('./src/route/Dashboard.route');
const history = require('./src/route/history.route');
const inventory = require('./src/route/inventory.route');

// Create Instance and Express application
const app = express();
const port = 3000;

/* middleware */
app.use(cors());
app.use(express.json());

/* test root */
app.get('/', (req, res) => {
  res.send('Backend is running on port 3000');
});

/* test api */
app.get('/api/test', (req, res) => {
  res.json({
    status: 'ok',
    message: 'API test success',
    port: 3000,
  });
});

// นำเข้าpathของrouterทุกหน้า
app.use('/api', Dashboard);
app.use('/api', history);
app.use('/api', inventory);

app.listen(port, '0.0.0.0', () => {
  console.log(`Server running at http://localhost:${port}`);
});

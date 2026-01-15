const express = require('express');
const cors = require('cors');

const { PythonShell } = require('python-shell');

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

app.post('/api/predict', (req, res) => {
  // ข้อมูลที่รับมาจาก Angular (เช่น [5.1, 3.5, 1.4])
  const inputData = req.body.data;

  let options = {
    mode: 'text',
    pythonPath: 'python', // หรือ 'python3' ตามที่คุณใช้
    pythonOptions: ['-u'], // get print results in real-time
  };

  let shell = new PythonShell('predict.py', options);

  // ส่งข้อมูลไปยัง Python
  shell.send(JSON.stringify(inputData));

  // รับผลลัพธ์กลับมา
  shell.on('message', function (message) {
    const result = JSON.parse(message);
    res.json({ prediction: result });
  });

  // จัดการ Error
  shell.end(function (err) {
    if (err) {
      console.error(err);
      return res.status(500).json({
        error: 'Python Error',
        details: err.message, // ส่งข้อความ error กลับไปดู
      });
    }
  });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Server running at http://localhost:${port}`);
});

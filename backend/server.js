// const express = require('express');
// // const dashboardRoutes = require('./src/route/Dashboard.route');

// const app = express();
// const port = 3000;

// // app.use('/api', dashboardRoutes);

// // test root
// app.get('/', (req, res) => {
//   res.send('Backend is running on port 3000');
// });

// // test api
// app.get('/api/test', (req, res) => {
//   res.json({
//     status: 'ok',
//     message: 'API test success',
//     port: 3000
//   });
// });

// app.listen(port, '0.0.0.0', () => {
//   console.log(`Server running at http://localhost:${port}`);
// });

const express = require('express');
const cors = require('cors');

const productsRoutes = require('./src/routes/products.route');

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
    port: 3000
  });
});

/* products api */
app.use('/api/products', productsRoutes);

app.listen(port, '0.0.0.0', () => {
  console.log(`Server running at http://localhost:${port}`);
});

require('dotenv').config();

console.log('MAIL_USER =', process.env.MAIL_USER);
console.log('has MAIL_PASS =', !!process.env.MAIL_PASS);
console.log('JWT_SECRET =', process.env.JWT_SECRET ? 'loaded' : 'missing');
console.log('DATABASE_URL =', process.env.DATABASE_URL ? 'loaded' : 'missing');

const express = require('express');
const cors = require('cors');
const pool = require('./src/config/database');

const userRoutes = require('./src/route/usermanagement.route');
const Dashboard = require('./src/route/Dashboard.route');
const history = require('./src/route/history.route');
const inventory = require('./src/route/inventory.route');
const authRoutes = require('./src/route/auth.route');
const product = require('./src/route/product.route');
const purchase = require('./src/route/purchase.route');
const purchasehistory = require('./src/route/purchasehistory.route');

const app = express();

app.use(
  cors({
    origin: [
      'https://manage-app-glcg.onrender.com',
      'https://manage-app-5koc.onrender.com',
      'http://localhost:4200',
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true,
  })
);

app.use(express.json());

app.get('/api/probe', (req, res) => {
  res.json({ probe: true, message: 'Backend is working' });
});

app.get('/api/test-db', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({
      ok: true,
      db: 'connected',
      time: result.rows[0],
    });
  } catch (err) {
    console.error('❌ TEST DB ERROR:', err.message);
    res.status(500).json({
      ok: false,
      error: err.message,
    });
  }
});

app.use('/api/users', userRoutes);
app.use('/uploads', express.static('uploads'));

app.use('/api/auth', authRoutes);
console.log('✅ auth mounted');

app.use('/api/dashboard', Dashboard);
console.log('✅ dashboard mounted');

app.use('/api/history', history);
console.log('✅ history mounted');

app.use('/api/inventory', inventory);
console.log('✅ inventory mounted');

app.use('/api/products', product);
console.log('✅ products mounted');

app.use('/api/purchase', purchase);
console.log('✅ purchase mounted');

app.use('/api/purchasehistory', purchasehistory);
console.log('✅ purchasehistory mounted');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`✅ server running on port ${PORT}`);
});
require('dotenv').config();

console.log('MAIL_USER =', process.env.MAIL_USER);
console.log('has MAIL_PASS =', !!process.env.MAIL_PASS);
console.log('JWT_SECRET =', process.env.JWT_SECRET ? 'loaded' : 'missing');
console.log('DATABASE_URL =', process.env.DATABASE_URL ? 'loaded' : 'missing');

const _exit = process.exit;
process.exit = (code) => {
  console.trace('🧨 process.exit called with code:', code);
  _exit(code);
};

process.on('exit', (code) => console.log('🧨 process exit code =', code));

process.on('SIGINT', () => {
  console.log('🧨 SIGINT (Ctrl+C)');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('🧨 SIGTERM (killed/terminated)');
  process.exit(0);
});

process.on('uncaughtException', (err) => {
  console.error('🧨 uncaughtException:', err);
});

process.on('unhandledRejection', (reason) => {
  console.error('🧨 unhandledRejection:', reason);
});

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
      'http://localhost:4200',
    ],
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

try {
  app.use('/api/auth', authRoutes);
  console.log('✅ auth mounted');
} catch (e) {
  console.error('❌ auth mount fail', e);
}

try {
  app.use('/api/dashboard', Dashboard);
  console.log('✅ dashboard mounted');
} catch (e) {
  console.error('❌ dashboard mount fail', e);
}

try {
  app.use('/api/history', history);
  console.log('✅ history mounted');
} catch (e) {
  console.error('❌ history mount fail', e);
}

try {
  app.use('/api/inventory', inventory);
  console.log('✅ inventory mounted');
} catch (e) {
  console.error('❌ inventory mount fail', e);
}

try {
  app.use('/api/products', product);
  console.log('✅ products mounted');
} catch (e) {
  console.error('❌ products mount fail', e);
}

try {
  app.use('/api/purchase', purchase);
  console.log('✅ purchase mounted');
} catch (e) {
  console.error('❌ purchase mount fail', e);
}

try {
  app.use('/api/purchasehistory', purchasehistory);
  console.log('✅ purchasehistory mounted');
} catch (e) {
  console.error('❌ purchasehistory mount fail', e);
}

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`server running on port ${PORT}`);
  console.log('server.listening =', server.listening);
  console.log('server.address() =', server.address());
});

server.on('listening', () => console.log('🟢 server listening event fired'));
server.on('close', () => console.log('🧨 server close event fired'));

setInterval(() => {
  console.log('⏳ still alive', new Date().toISOString());
}, 5000);
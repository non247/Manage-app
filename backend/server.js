// const express = require('express');
// const cors = require('cors');

// const Dashboard = require('./src/route/Dashboard.route');
// const history = require('./src/route/history.route');
// const inventory = require('./src/route/inventory.route');
// const authRoutes = require('./src/route/auth.route');
// const userRoutes = require('./src/route/usermanagement.route'); // ✅ เพิ่ม

// const app = express();
// const port = 3000;

// app.use(cors());
// app.use(express.json());

// app.get('/', (req, res) => res.send('Backend is running on port 3000'));

// // ✅ probe route
// app.get('/api/probe', (req, res) => res.json({ probe: true }));

// app.use('/api/users', userRoutes);
// app.use('/api', Dashboard);
// app.use('/api', history);
// app.use('/api', inventory);
// console.log('✅ userRoutes mounted at /api/users');
// app.use('/api/auth', authRoutes);

// app.listen(port, '0.0.0.0', () => {
//   console.log(`Server running at http://localhost:${port}`);
// });

// const express = require('express');
// const cors = require('cors');

// const userRoutes = require('./src/route/usermanagement.route');

// const app = express();
// const port = 3000;

// app.use(cors());
// app.use(express.json());

// app.get('/api/probe', (req, res) => res.json({ probe: true }));

// app.use('/api/users', userRoutes);

// app.listen(port, () => console.log(`Server running at http://localhost:${port}`));

const express = require('express');
const cors = require('cors');

const userRoutes = require('./src/route/usermanagement.route');
const Dashboard = require('./src/route/Dashboard.route');
const history = require('./src/route/history.route');
const inventory = require('./src/route/inventory.route');
const authRoutes = require('./src/route/auth.route');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/probe', (req,res)=>res.json({probe:true}));

app.use('/api/users', userRoutes); // ✅ ตัวนี้คุณรู้ว่าใช้ได้

// ✅ เปิดทีละอัน
try { app.use('/api/auth', authRoutes); console.log('✅ auth mounted'); } catch(e){ console.error('❌ auth mount fail', e); }
try { app.use('/api', Dashboard);       console.log('✅ dashboard mounted'); } catch(e){ console.error('❌ dashboard mount fail', e); }
try { app.use('/api', history);         console.log('✅ history mounted'); } catch(e){ console.error('❌ history mount fail', e); }
try { app.use('/api', inventory);       console.log('✅ inventory mounted'); } catch(e){ console.error('❌ inventory mount fail', e); }

app.listen(3000, ()=>console.log('server 3000'));

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

exports.register = async (req, res) => {
  try {
    const { username, password, role = 'user' } = req.body;

    // 1️⃣ เช็ค username ซ้ำ
    const exists = await pool.query(
      `SELECT 1 FROM "User" WHERE "Username" = $1`,
      [username]
    );

    if (exists.rowCount > 0) {
      return res.status(409).json({ message: 'Username exists' });
    }

    // 2️⃣ hash password
    const hash = await bcrypt.hash(password, 10);

    // 3️⃣ insert user
    const result = await pool.query(
      `
      INSERT INTO "User" ("Username", "Password", "Role")
      VALUES ($1, $2, $3)
      RETURNING "Id", "Username", "Role"
      `,
      [username, hash, role]
    );

    res.status(201).json({
      ok: true,
      user: result.rows[0],
    });
  } catch (error) {
    console.error('❌ Register API Error:', error.message);
    res.status(500).json({ error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // 🔥 ================= MOCK ADMIN =================
    if (username === 'admin' && password === '1234') {
      const token = jwt.sign(
        { sub: 0, username: 'admin', role: 'admin' },
        JWT_SECRET,
        { expiresIn: '2h' }
      );

      return res.json({
        token,
        role: 'admin',
        username: 'admin',
      });
    }
    // 🔥 =============================================

    // 1️⃣ ดึง user จาก DB
    const result = await pool.query(
      `
      SELECT "Id", "Username", "Password", "Role"
      FROM "User"
      WHERE "Username" = $1
      `,
      [username]
    );

    if (result.rowCount === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = result.rows[0];

    // 2️⃣ compare password
    const ok = await bcrypt.compare(password, user.Password);

    if (!ok) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // 3️⃣ สร้าง token
    const token = jwt.sign(
      { sub: user.Id, username: user.Username, role: user.Role },
      JWT_SECRET,
      { expiresIn: '2h' }
    );

    res.json({
      token,
      role: user.Role,
      username: user.Username,
    });
  } catch (error) {
    console.error('❌ Login API Error:', error.message);
    res.status(500).json({ error: error.message });
  }
};

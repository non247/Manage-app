const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

/* =========================
   REGISTER
========================= */
exports.register = async (req, res) => {
  try {
    const { username, password, email, role = 'user' } = req.body;

    // ✅ validate
    if (!username || !password || !email) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // ✅ email format
    const emailRegex = /^[^\s@]+\@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    // 🔍 check username ซ้ำ
    const existsUsername = await pool.query(
      `SELECT 1 FROM "User" WHERE "Username" = $1`,
      [username]
    );

    if (existsUsername.rowCount > 0) {
      return res.status(409).json({ message: 'Username exists' });
    }

    // 🔍 check email ซ้ำ
    const existsEmail = await pool.query(
      `SELECT 1 FROM "User" WHERE "Email" = $1`,
      [email]
    );

    if (existsEmail.rowCount > 0) {
      return res.status(409).json({ message: 'Email already used' });
    }

    // 🔐 hash password
    const hash = await bcrypt.hash(password, 10);

    // 💾 insert
    const result = await pool.query(
      `
      INSERT INTO "User" ("Username", "Password", "Email", "Role")
      VALUES ($1, $2, $3, $4)
      RETURNING "Id", "Username", "Email", "Role"
      `,
      [username, hash, email, role]
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

/* =========================
   LOGIN
========================= */
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // 🔥 MOCK ADMIN
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

    // 🔍 หา user (login ด้วย username หรือ email)
    const result = await pool.query(
      `
      SELECT "Id", "Username", "Password", "Role", "Email"
      FROM "User"
      WHERE "Username" = $1 OR "Email" = $1
      `,
      [username]
    );

    if (result.rowCount === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = result.rows[0];

    // 🔐 check password
    const ok = await bcrypt.compare(password, user.Password);

    if (!ok) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // 🎟 token
    const token = jwt.sign(
      {
        sub: user.Id,
        username: user.Username,
        role: user.Role,
        email: user.Email,
      },
      JWT_SECRET,
      { expiresIn: '2h' }
    );

    res.json({
      token,
      role: user.Role,
      username: user.Username,
      email: user.Email,
    });
  } catch (error) {
    console.error('❌ Login API Error:', error.message);
    res.status(500).json({ error: error.message });
  }
};

/* =========================
   FORGOT PASSWORD
========================= */
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // ✅ validate
    if (!email || !email.trim()) {
      return res.status(400).json({ message: 'กรุณากรอกอีเมล' });
    }

    // ✅ email format
    const emailRegex = /^[^\s@]+\@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({ message: 'รูปแบบอีเมลไม่ถูกต้อง' });
    }

    // 🔍 check user by email
    const result = await pool.query(
      `
      SELECT "Id", "Username", "Email"
      FROM "User"
      WHERE "Email" = $1
      `,
      [email.trim()]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'ไม่พบอีเมลนี้ในระบบ' });
    }

    const user = result.rows[0];

    // ✅ ตอนนี้ยังไม่ได้ส่งอีเมลจริง
    // ภายหลังสามารถเพิ่ม nodemailer + reset token ได้ตรงนี้

    return res.json({
      ok: true,
      message: 'ส่งลิงก์รีเซ็ตรหัสผ่านเรียบร้อยแล้ว',
      user: {
        id: user.Id,
        username: user.Username,
        email: user.Email,
      },
    });
  } catch (error) {
    console.error('❌ Forgot Password API Error:', error.message);
    res.status(500).json({ error: error.message });
  }
};
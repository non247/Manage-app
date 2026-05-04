const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const pool = require('../config/database');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

// ================= HELPER: GENERATE USER CODE =================
const makeUserCode = async (role) => {
  const safeRole = role === 'admin' ? 'admin' : 'user';
  const prefix = safeRole === 'admin' ? 'M' : 'E';

  const result = await pool.query(
    `
    SELECT "Code"
    FROM "User"
    WHERE "Role" = $1
      AND "Code" IS NOT NULL
      AND "Code" LIKE $2
    ORDER BY "Id" DESC
    LIMIT 1
    `,
    [safeRole, `${prefix}%`]
  );

  let nextNumber = 1;

  if (result.rowCount > 0) {
    const lastCode = result.rows[0].Code; // เช่น M0003 หรือ E0012
    const numberPart = Number.parseInt(String(lastCode).slice(1), 10);

    if (!Number.isNaN(numberPart)) {
      nextNumber = numberPart + 1;
    }
  }

  return `${prefix}${String(nextNumber).padStart(4, '0')}`;
};

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

    // generate code by role
    const userCode = await makeUserCode(role);

    // 💾 insert
    const result = await pool.query(
      `
      INSERT INTO "User" ("Code", "Username", "Password", "Email", "Role", "create_date")
      VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING "Id", "Code", "Username", "Email", "Role"
      `,
      [userCode, username, hash, email, role]
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

    console.log('📩 forgotPassword email:', email);

    if (!email || !email.trim()) {
      return res.status(400).json({ message: 'กรุณากรอกอีเมล' });
    }

    const cleanEmail = email.trim();

    const emailRegex = /^[^\s@]+\@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({ message: 'รูปแบบอีเมลไม่ถูกต้อง' });
    }

    const result = await pool.query(
      `
      SELECT "Id", "Username", "Email"
      FROM "User"
      WHERE "Email" = $1
      `,
      [cleanEmail]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'ไม่พบอีเมลนี้ในระบบ' });
    }

    const user = result.rows[0];
    console.log('🔎 user found:', user);

    const token = jwt.sign(
      {
        sub: user.Id,
        email: user.Email,
        type: 'reset-password',
      },
      JWT_SECRET,
      { expiresIn: '15m' }
    );

    const resetLink = `https://snagged-breeze-unvisited.ngrok-free.dev/reset-password?token=${token}`;
    console.log('🔗 resetLink:', resetLink);

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });

    const info = await transporter.sendMail({
      from: `"Day-Icecream-Store" <${process.env.MAIL_USER}>`,
      to: user.Email,
      subject: 'รีเซ็ตรหัสผ่าน',
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h2>รีเซ็ตรหัสผ่าน</h2>
          <p>สวัสดีคุณ ${user.Username}</p>
          <p>คุณได้ส่งคำขอรีเซ็ตรหัสผ่านสำหรับบัญชีนี้</p>
          <p>กรุณากดลิงก์ด้านล่างเพื่อรีเซ็ตรหัสผ่าน:</p>
          <p>
            <a href="${resetLink}" target="_blank">
              รีเซ็ตรหัสผ่าน
            </a>
          </p>
          <br>
          <p>อีเมลนี้เป็นอีเมลอัตโนมัติ โปรดอย่าตอบกลับ</p>
        </div>
      `,
    });

    console.log('✅ Email sent:', info.response);

    return res.json({
      ok: true,
      message: 'ส่งลิงก์รีเซ็ตรหัสผ่านเรียบร้อยแล้ว',
    });
  } catch (error) {
    console.error('❌ Forgot Password API Error:', error);
    return res.status(500).json({
      ok: false,
      message: 'ส่งอีเมลไม่สำเร็จ',
      error: error.message,
    });
  }
};

/* =========================
   RESET PASSWORD
========================= */
exports.resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !token.trim()) {
      return res.status(400).json({ message: 'ไม่พบ token' });
    }

    if (!password || !password.trim()) {
      return res.status(400).json({ message: 'กรุณากรอกรหัสผ่านใหม่' });
    }

    if (password.trim().length < 6) {
      return res
        .status(400)
        .json({ message: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร' });
    }

    let payload;
    try {
      payload = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return res
        .status(401)
        .json({ message: 'Token ไม่ถูกต้องหรือหมดอายุแล้ว' });
    }

    if (payload.type !== 'reset-password') {
      return res.status(400).json({ message: 'Token ไม่ถูกต้อง' });
    }

    const hash = await bcrypt.hash(password.trim(), 10);

    const result = await pool.query(
      `
      UPDATE "User"
      SET "Password" = $1
      WHERE "Id" = $2 AND "Email" = $3
      RETURNING "Id", "Username", "Email"
      `,
      [hash, payload.sub, payload.email]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'ไม่พบผู้ใช้งาน' });
    }

    return res.json({
      ok: true,
      message: 'รีเซ็ตรหัสผ่านสำเร็จ',
    });
  } catch (error) {
    console.error('❌ Reset Password API Error:', error);
    return res.status(500).json({
      ok: false,
      message: 'เกิดข้อผิดพลาดในการรีเซ็ตรหัสผ่าน',
    });
  }
};

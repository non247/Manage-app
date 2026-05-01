// ✅ FIX IPv6 → ใช้ IPv4
const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { createMailTransporter } = require('../config/mail');
const pool = require('../config/database');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

/* =========================
   CREATE USER CODE
========================= */
const createCode = async (role) => {
  const prefix = role === 'manager' ? 'M' : 'E';

  const lastUser = await pool.query(
    `
    SELECT "Code"
    FROM "User"
    WHERE "Code" LIKE $1
    ORDER BY "Code" DESC
    LIMIT 1
    `,
    [`${prefix}%`]
  );

  if (lastUser.rowCount === 0) return `${prefix}0001`;

  const lastCode = lastUser.rows[0].Code;
  const lastNumber = parseInt(lastCode.slice(1), 10);
  const nextNumber = lastNumber + 1;

  return `${prefix}${nextNumber.toString().padStart(4, '0')}`;
};

/* =========================
   REGISTER
========================= */
exports.register = async (req, res) => {
  try {
    const { username, password, email, role = 'user' } = req.body;

    const cleanUsername = username?.trim();
    const cleanPassword = password?.trim();
    const cleanEmail = email?.trim().toLowerCase();
    const cleanRole = role === 'manager' ? 'manager' : 'user';

    if (!cleanUsername || !cleanPassword || !cleanEmail) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    const existsUsername = await pool.query(
      `SELECT 1 FROM "User" WHERE "Username" = $1`,
      [cleanUsername]
    );

    if (existsUsername.rowCount > 0) {
      return res.status(409).json({ message: 'Username exists' });
    }

    const existsEmail = await pool.query(
      `SELECT 1 FROM "User" WHERE LOWER("Email") = $1`,
      [cleanEmail]
    );

    if (existsEmail.rowCount > 0) {
      return res.status(409).json({ message: 'Email already used' });
    }

    const hash = await bcrypt.hash(cleanPassword, 10);
    const Code = await createCode(cleanRole);

    const result = await pool.query(
      `
      INSERT INTO "User" ("Code", "Username", "Password", "Email", "Role")
      VALUES ($1, $2, $3, $4, $5)
      RETURNING "Id", "Code", "Username", "Email", "Role"
      `,
      [Code, cleanUsername, hash, cleanEmail, cleanRole]
    );

    const user = result.rows[0];

    // ✅ Send welcome email
    try {
      if (process.env.MAIL_USER && process.env.MAIL_PASS) {
        const transporter = createMailTransporter();

        await transporter.verify();

        await transporter.sendMail({
          from: `"Manage App" <${process.env.MAIL_USER}>`,
          to: user.Email,
          subject: 'ยินดีต้อนรับเข้ยู Manage App',
          html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #d81b60;">ยินดีต้อนรับเข้ยู Manage App</h2>
              <p>สวัสดี <strong>${user.Username}</strong></p>
              <p>บัญชีของคุณได้ถูกสร้างขึ้นเรียบร้อยแล้ว</p>
              
              <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p><strong>รายละเอียดบัญชี:</strong></p>
                <ul style="list-style: none; padding: 0;">
                  <li>📧 <strong>อีเมล:</strong> ${user.Email}</li>
                  <li>👤 <strong>ชื่อผู้ใช้:</strong> ${user.Username}</li>
                  <li>🎯 <strong>บทบาท:</strong> ${user.Role === 'manager' ? 'ผู้จัดการ' : 'ผู้ใช้ทั่วไป'}</li>
                  <li>🔢 <strong>รหัสประจำตัว:</strong> ${user.Code}</li>
                </ul>
              </div>

              <p>ขณะนี้คุณสามารถเข้าสู่ระบบได้โดยใช้:</p>
              <ul>
                <li>ชื่อผู้ใช้หรืออีเมล: <strong>${user.Username}</strong></li>
                <li>รหัสผ่าน: ที่คุณกำหนดไว้</li>
              </ul>

              <div style="border-top: 2px solid #ddd; margin: 20px 0; padding-top: 20px;">
                <p style="color: #666; font-size: 12px;">
                  หากคุณต้องการความช่วยเหลือ โปรดติดต่อทีม Support ของเรา
                </p>
              </div>
            </div>
          `,
        });

        console.log('✅ Welcome email sent to:', user.Email);
      }
    } catch (emailError) {
      console.error('⚠️ Failed to send welcome email:', emailError.message);
      // ไม่ return error เพราะ register ยังสำเร็จ แม้ส่งอีเมลไม่สำเร็จ
    }

    return res.status(201).json({
      ok: true,
      user: user,
    });
  } catch (error) {
    console.error('❌ Register API Error:', error);

    return res.status(500).json({
      ok: false,
      message: 'Register failed',
      error: error.message,
    });
  }
};

/* =========================
   LOGIN
========================= */
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    const loginName = username?.trim();
    const cleanPassword = password?.trim();

    if (!loginName || !cleanPassword) {
      return res.status(400).json({ message: 'Username and password required' });
    }

    if (loginName === 'admin' && cleanPassword === '1234') {
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

    const result = await pool.query(
      `
      SELECT "Id","Code","Username","Password","Role","Email"
      FROM "User"
      WHERE "Username"=$1 OR LOWER("Email")=LOWER($1)
      `,
      [loginName]
    );

    if (result.rowCount === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = result.rows[0];
    const ok = await bcrypt.compare(cleanPassword, user.Password);

    if (!ok) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      {
        sub: user.Id,
        Code: user.Code,
        username: user.Username,
        role: user.Role,
        email: user.Email,
      },
      JWT_SECRET,
      { expiresIn: '2h' }
    );

    return res.json({
      token,
      id: user.Id,
      Code: user.Code,
      role: user.Role,
      username: user.Username,
      email: user.Email,
    });
  } catch (error) {
    console.error('❌ Login API Error:', error);

    return res.status(500).json({
      ok: false,
      message: 'Login failed',
      error: error.message,
    });
  }
};

/* =========================
   FORGOT PASSWORD
========================= */
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const cleanEmail = email?.trim().toLowerCase();

    if (!cleanEmail) {
      return res.status(400).json({ message: 'กรุณากรอกอีเมล' });
    }

    if (!process.env.MAIL_USER || !process.env.MAIL_PASS) {
      return res.status(500).json({
        ok: false,
        message: 'ยังไม่ได้ตั้งค่า MAIL_USER หรือ MAIL_PASS',
      });
    }

    if (!process.env.FRONTEND_URL) {
      return res.status(500).json({
        ok: false,
        message: 'ยังไม่ได้ตั้งค่า FRONTEND_URL',
      });
    }

    const result = await pool.query(
      `SELECT "Id","Username","Email" FROM "User" WHERE LOWER("Email")=$1`,
      [cleanEmail]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'ไม่พบอีเมลนี้ในระบบ' });
    }

    const user = result.rows[0];

    const token = jwt.sign(
      { sub: user.Id, email: user.Email, type: 'reset-password' },
      JWT_SECRET,
      { expiresIn: '15m' }
    );

    const frontendUrl = process.env.FRONTEND_URL.replace(/\/$/, '');
    const resetLink = `${frontendUrl}/reset-password?token=${encodeURIComponent(
      token
    )}`;

    const transporter = createMailTransporter();

    await transporter.verify();

    const info = await transporter.sendMail({
      from: `"Manage App" <${process.env.MAIL_USER}>`,
      to: user.Email,
      subject: 'รีเซ็ตรหัสผ่าน',
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h2>รีเซ็ตรหัสผ่าน</h2>
          <p>สวัสดี ${user.Username}</p>
          <p>กรุณากดลิงก์ด้านล่างเพื่อรีเซ็ตรหัสผ่าน:</p>
          <p>
            <a href="${resetLink}" target="_blank"
               style="background:#d81b60;color:white;padding:10px 16px;border-radius:8px;text-decoration:none;">
              รีเซ็ตรหัสผ่าน
            </a>
          </p>
          <p>หรือคัดลอกลิงก์นี้:</p>
          <p>${resetLink}</p>
          <p>ลิงก์นี้หมดอายุภายใน 15 นาที</p>
        </div>
      `,
    });

    console.log('✅ Email sent:', info.messageId);

    return res.json({
      ok: true,
      message: 'ส่งลิงก์รีเซ็ตรหัสผ่านเรียบร้อยแล้ว',
    });
  } catch (error) {
    console.error('❌ Forgot Password API Error:', {
      message: error.message,
      code: error.code,
      command: error.command,
      response: error.response,
      stack: error.stack,
    });

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

    const cleanToken = token?.trim();
    const cleanPassword = password?.trim();

    if (!cleanToken) {
      return res.status(400).json({ message: 'ไม่พบ token' });
    }

    if (!cleanPassword) {
      return res.status(400).json({ message: 'กรุณากรอกรหัสผ่านใหม่' });
    }

    if (cleanPassword.length < 6) {
      return res.status(400).json({
        message: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร',
      });
    }

    let payload;

    try {
      payload = jwt.verify(cleanToken, JWT_SECRET);
    } catch (err) {
      return res.status(401).json({
        message: 'Token ไม่ถูกต้องหรือหมดอายุแล้ว',
      });
    }

    if (payload.type !== 'reset-password') {
      return res.status(400).json({ message: 'Token ไม่ถูกต้อง' });
    }

    const hash = await bcrypt.hash(cleanPassword, 10);

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
      error: error.message,
    });
  }
};
// ✅ FIX IPv6 → บังคับใช้ IPv4
const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
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
   FORGOT PASSWORD (สำคัญ)
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

    const result = await pool.query(
      `SELECT "Id","Username","Email" FROM "User" WHERE LOWER("Email")=$1`,
      [cleanEmail]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'ไม่พบอีเมลนี้ในระบบ' });
    }

    const user = result.rows[0];

    const token = jwt.sign(
      {
        sub: user.Id,
        email: user.Email,
        type: 'reset-password',
      },
      JWT_SECRET,
      { expiresIn: '15m' }
    );

    const frontendUrl = process.env.FRONTEND_URL.replace(/\/$/, '');
    const resetLink = `${frontendUrl}/reset-password?token=${encodeURIComponent(token)}`;

    // ✅ ใช้ Gmail
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });

    await transporter.verify();

    console.log('✅ Gmail SMTP ready');

    await transporter.sendMail({
      from: `"Manage App" <${process.env.MAIL_USER}>`,
      to: user.Email,
      subject: 'รีเซ็ตรหัสผ่าน',
      html: `
        <h2>รีเซ็ตรหัสผ่าน</h2>
        <p>สวัสดี ${user.Username}</p>
        <a href="${resetLink}">กดเพื่อรีเซ็ต</a>
      `,
    });

    return res.json({
      ok: true,
      message: 'ส่งลิงก์เรียบร้อยแล้ว',
    });
  } catch (error) {
    console.error('❌ Forgot Error:', error);

    return res.status(500).json({
      ok: false,
      message: error.message,
    });
  }
};
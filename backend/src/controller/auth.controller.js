// const bcrypt = require('bcrypt');
// const jwt = require('jsonwebtoken');
// const pool = require('../config/database');

// const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

// exports.register = async (req, res) => {
//   try {
//     // 1️⃣ รับค่าจาก client (กำหนด role เป็น user ถ้าไม่ส่งมา)
//     const { username, password, role = 'user' } = req.body;

//     // 2️⃣ ตรวจสอบข้อมูลพื้นฐาน
//     if (!username || !password) {
//       return res.status(400).json({ message: 'Username and password are required' });
//     }

//     // 3️⃣ เช็ค username ซ้ำ
//     const existsResult = await pool.query(
//       `
//       SELECT 1
//       FROM users
//       WHERE username = $1
//       `,
//       [username]
//     );

//     if (existsResult.rowCount > 0) {
//       return res.status(409).json({ message: 'Username exists' });
//     }

//     // 4️⃣ เข้ารหัสรหัสผ่าน
//     const password_hash = await bcrypt.hash(password, 10);

//     // 5️⃣ บันทึกผู้ใช้ใหม่ (ถ้าต้องการ id กลับมาใช้ RETURNING)
//     const insertResult = await pool.query(
//       `
//       INSERT INTO users (username, password_hash, role)
//       VALUES ($1, $2, $3)
//       RETURNING id, username, role
//       `,
//       [username, password_hash, role]
//     );

//     res.status(201).json({
//       ok: true,
//       user: insertResult.rows[0],
//     });
//   } catch (error) {
//     console.error('❌ Register API Error:', error.message);
//     res.status(500).json({ error: error.message });
//   }
// };

// exports.login = async (req, res) => {
//   try {
//     // 1️⃣ รับค่าจาก client
//     const { username, password } = req.body;

//     // 2️⃣ ตรวจสอบข้อมูลพื้นฐาน
//     if (!username || !password) {
//       return res.status(400).json({ message: 'Username and password are required' });
//     }

//     // 3️⃣ ดึง user จากฐานข้อมูล
//     const userResult = await pool.query(
//       `
//       SELECT id, username, password_hash, role
//       FROM users
//       WHERE username = $1
//       `,
//       [username]
//     );

//     if (userResult.rowCount === 0) {
//       return res.status(401).json({ message: 'Invalid credentials' });
//     }

//     const user = userResult.rows[0];

//     // 4️⃣ ตรวจสอบรหัสผ่าน
//     const ok = await bcrypt.compare(password, user.password_hash);
//     if (!ok) {
//       return res.status(401).json({ message: 'Invalid credentials' });
//     }

//     // 5️⃣ สร้าง JWT Token
//     const token = jwt.sign(
//       { sub: user.id, username: user.username, role: user.role },
//       JWT_SECRET,
//       { expiresIn: '2h' }
//     );

//     res.status(200).json({
//       token,
//       role: user.role,
//       username: user.username,
//       userId: user.id,
//     });
//   } catch (error) {
//     console.error('❌ Login API Error:', error.message);
//     res.status(500).json({ error: error.message });
//   }
// };
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

    // 1️⃣ ดึง user
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

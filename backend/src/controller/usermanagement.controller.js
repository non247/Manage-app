const pool = require('../config/database');
const bcrypt = require('bcrypt');

// ================= HELPER: GENERATE USER CODE =================
const makeUserCode = async (role) => {
  const safeRole = role === 'admin' ? 'admin' : 'user';
  const prefix = safeRole === 'admin' ? 'M' : 'E';

  const result = await pool.query(
    `
    SELECT "Code"
    FROM public."User"
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
    const numberPart = parseInt(String(lastCode).slice(1), 10);

    if (!Number.isNaN(numberPart)) {
      nextNumber = numberPart + 1;
    }
  }

  return `${prefix}${String(nextNumber).padStart(4, '0')}`;
};

// ================= GET ALL USERS =================
exports.getUsers = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT "Id", "Code", "Username", "Email", "Role"
      FROM public."User"
      ORDER BY "Role" ASC , "Code" ASC
    `);

    return res.json(result.rows);
  } catch (err) {
    console.error('getUsers error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// ================= GET USER BY ID =================
exports.getUserById = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `
      SELECT "Id", "Code", "Username", "Email", "Role"
      FROM public."User"
      WHERE "Id" = $1
      `,
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.json(result.rows[0]);
  } catch (err) {
    console.error('getUserById error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// ================= CREATE USER =================
exports.createUser = async (req, res) => {
  const { Username, Password, Email, Role } = req.body;

  try {
    if (!Username || !Password || !Email) {
      return res
        .status(400)
        .json({ message: 'Username, Password and Email are required' });
    }

    const cleanUsername = Username.trim();
    const cleanEmail = Email.trim().toLowerCase();
    const safeRole = Role === 'admin' ? 'admin' : 'user';

    if (!cleanUsername || !cleanEmail) {
      return res
        .status(400)
        .json({ message: 'Username, Password and Email are required' });
    }

    // check duplicate username
    const existsUsername = await pool.query(
      `SELECT 1 FROM public."User" WHERE "Username" = $1`,
      [cleanUsername]
    );

    if (existsUsername.rowCount > 0) {
      return res.status(409).json({ message: 'Username already exists' });
    }

    // check duplicate email
    const existsEmail = await pool.query(
      `SELECT 1 FROM public."User" WHERE LOWER("Email") = LOWER($1)`,
      [cleanEmail]
    );

    if (existsEmail.rowCount > 0) {
      return res.status(409).json({ message: 'Email already exists' });
    }

    const hash = await bcrypt.hash(Password, 10);

    // generate code by role
    const userCode = await makeUserCode(safeRole);

    const result = await pool.query(
      `
      INSERT INTO public."User" ("Code", "Username", "Password", "Email", "Role", "create_date")
      VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING "Id", "Code", "Username", "Email", "Role", "create_date"
      `,
      [userCode, cleanUsername, hash, cleanEmail, safeRole]
    );

    return res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('createUser error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// ================= UPDATE USER =================
exports.updateUser = async (req, res) => {
  const { id } = req.params;
  const { Username, Email, Role } = req.body;

  try {
    if (!Username || !Email || !Role) {
      return res
        .status(400)
        .json({ message: 'Username, Email and Role are required' });
    }

    const cleanUsername = Username.trim();
    const cleanEmail = Email.trim().toLowerCase();
    const safeRole = Role === 'admin' ? 'admin' : 'user';

    if (!cleanUsername || !cleanEmail) {
      return res
        .status(400)
        .json({ message: 'Username, Email and Role are required' });
    }

    // check duplicate username from another user
    const existsUsername = await pool.query(
      `
      SELECT 1
      FROM public."User"
      WHERE "Username" = $1 AND "Id" <> $2
      `,
      [cleanUsername, id]
    );

    if (existsUsername.rowCount > 0) {
      return res.status(409).json({ message: 'Username already exists' });
    }

    // check duplicate email from another user
    const existsEmail = await pool.query(
      `
      SELECT 1
      FROM public."User"
      WHERE LOWER("Email") = LOWER($1) AND "Id" <> $2
      `,
      [cleanEmail, id]
    );

    if (existsEmail.rowCount > 0) {
      return res.status(409).json({ message: 'Email already exists' });
    }

    // ดึง role เดิมของ user
    const oldUser = await pool.query(
      `
      SELECT "Role", "Code"
      FROM public."User"
      WHERE "Id" = $1
      `,
      [id]
    );

    if (oldUser.rowCount === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    let userCode = oldUser.rows[0].Code;

    // ถ้ามีการเปลี่ยน role ให้ generate code ใหม่ตาม role ใหม่
    if (oldUser.rows[0].Role !== safeRole) {
      userCode = await makeUserCode(safeRole);
    }

    const result = await pool.query(
      `
      UPDATE public."User"
      SET "Code" = $1,
          "Username" = $2,
          "Email" = $3,
          "Role" = $4
      WHERE "Id" = $5
      RETURNING "Id", "Code", "Username", "Email", "Role"
      `,
      [userCode, cleanUsername, cleanEmail, safeRole, id]
    );

    return res.json(result.rows[0]);
  } catch (err) {
    console.error('updateUser error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// ================= DELETE USER =================
exports.deleteUser = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `DELETE FROM public."User" WHERE "Id" = $1`,
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.json({ message: 'User deleted' });
  } catch (err) {
    console.error('deleteUser error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

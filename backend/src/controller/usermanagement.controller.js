const pool = require('../config/database');
const bcrypt = require('bcrypt');

// ================= GET ALL USERS =================
exports.getUsers = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT "Id", "Username", "Email", "Role"
      FROM public."User"
      ORDER BY "Id" ASC
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
      SELECT "Id", "Username", "Email", "Role"
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

    const result = await pool.query(
      `
      INSERT INTO public."User" ("Username", "Password", "Email", "Role")
      VALUES ($1, $2, $3, $4)
      RETURNING "Id", "Username", "Email", "Role"
      `,
      [cleanUsername, hash, cleanEmail, Role || 'user']
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

    const result = await pool.query(
      `
      UPDATE public."User"
      SET "Username" = $1,
          "Email" = $2,
          "Role" = $3
      WHERE "Id" = $4
      RETURNING "Id", "Username", "Email", "Role"
      `,
      [cleanUsername, cleanEmail, Role, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

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
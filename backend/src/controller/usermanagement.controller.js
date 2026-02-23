const pool = require('../config/database');
const bcrypt = require('bcrypt');

// ================= GET ALL USERS =================
exports.getUsers = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT "Id", "Username", "Role"
      FROM public."User"
      ORDER BY "Id" ASC
    `);
    return res.json(result.rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// ================= GET USER BY ID =================
exports.getUserById = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `
      SELECT "Id", "Username", "Role"
      FROM public."User"
      WHERE "Id" = $1`,
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// ================= CREATE USER =================
exports.createUser = async (req, res) => {
  const { Username, Password, Role } = req.body;

  try {
    if (!Username || !Password) {
      return res.status(400).json({ message: 'Username & Password required' });
    }

    // check duplicate username
    const exists = await pool.query(
      `SELECT 1 FROM public."User" WHERE "Username" = $1`,
      [Username]
    );
    if (exists.rowCount > 0) {
      return res.status(409).json({ message: 'Username already exists' });
    }

    const hash = await bcrypt.hash(Password, 10);

    const result = await pool.query(
      `INSERT INTO public."User" ("Username", "Password", "Role")
      VALUES ($1, $2, $3)
      RETURNING "Id", "Username", "Role"`,
      [Username, hash, Role || 'user']
    );

    return res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// ================= UPDATE USER =================
exports.updateUser = async (req, res) => {
  const { id } = req.params;
  const { Username, Role } = req.body;

  try {
    if (!Username || !Role) {
      return res.status(400).json({ message: 'Username & Role required' });
    }

    const result = await pool.query(
      `UPDATE public."User"
      SET "Username" = $1,"Role" = $2
      WHERE "Id" = $3
      RETURNING "Id", "Username", "Role"`,
      [Username, Role, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
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
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

const pool = require('../config/database');

// GET /api/products?search=...
exports.getAllProducts = async (req, res) => {
  try {
    const { search = '' } = req.query;

    const params = [];
    let where = 'WHERE 1=1';

    if (search.trim()) {
      params.push(`%${search.trim()}%`);
      where += ` AND "name" ILIKE $${params.length}`;
    }

    const sql = `
      SELECT
        "Id"    AS id,
        "name"  AS name,
        "price" AS price,
        "image" AS image
      FROM public."Product"
      ${where}
      ORDER BY "Id" DESC
    `;

    const result = await pool.query(sql, params);
    return res.json(result.rows);
  } catch (err) {
    console.error('getAllProducts error:', err);
    return res
      .status(500)
      .json({ message: 'Server error', error: String(err.message || err) });
  }
};

// GET /api/products/:id
exports.getProductById = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id))
      return res.status(400).json({ message: 'Invalid id' });

    const result = await pool.query(
      `
      SELECT
        "Id"    AS id,
        "name"  AS name,
        "price" AS price,
        "image" AS image
      FROM public."Product"
      WHERE "Id" = $1
      `,
      [id]
    );

    if (result.rowCount === 0)
      return res.status(404).json({ message: 'Product not found' });
    return res.json(result.rows[0]);
  } catch (err) {
    console.error('getProductById error:', err);
    return res
      .status(500)
      .json({ message: 'Server error', error: String(err.message || err) });
  }
};

// POST /api/products
exports.createProduct = async (req, res) => {
  try {
    const { name, price } = req.body;

    if (!name || !String(name).trim()) {
      return res.status(400).json({ message: 'name is required' });
    }
    if (price === undefined || price === null || Number(price) <= 0) {
      return res.status(400).json({ message: 'price must be > 0' });
    }

    // ✅ เอาชื่อไฟล์จาก multer
    const image = req.file ? `/uploads/${req.file.filename}` : null;

    const result = await pool.query(
      `
      INSERT INTO public."Product" ("name", "price", "image")
      VALUES ($1, $2, $3)
      RETURNING "Id" AS id, "name" AS name, "price" AS price, "image" AS image
      `,
      [String(name).trim(), Number(price), image]
    );

    return res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('createProduct error:', err);
    return res
      .status(500)
      .json({ message: 'Server error', error: String(err.message || err) });
  }
};

// PUT /api/products/:id
exports.updateProduct = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id))
      return res.status(400).json({ message: 'Invalid id' });

    const { name, price } = req.body;

    const sets = [];
    const params = [];
    const add = (col, val) => {
      params.push(val);
      sets.push(`${col} = $${params.length}`);
    };

    if (name !== undefined) {
      if (!String(name).trim())
        return res.status(400).json({ message: 'name is invalid' });
      add(`"name"`, String(name).trim());
    }
    if (price !== undefined) {
      if (Number(price) <= 0 || Number.isNaN(Number(price)))
        return res.status(400).json({ message: 'price must be > 0' });
      add(`"price"`, Number(price));
    }

    // ✅ ถ้ามีอัปโหลดไฟล์มา ให้ update image
    if (req.file) {
      add(`"image"`, `/uploads/${req.file.filename}`);
    }

    if (sets.length === 0)
      return res.status(400).json({ message: 'No fields to update' });

    params.push(id);

    const sql = `
      UPDATE public."Product"
      SET ${sets.join(', ')}
      WHERE "Id" = $${params.length}
      RETURNING "Id" AS id, "name" AS name, "price" AS price, "image" AS image
    `;

    const result = await pool.query(sql, params);
    if (result.rowCount === 0)
      return res.status(404).json({ message: 'Product not found' });

    return res.json(result.rows[0]);
  } catch (err) {
    console.error('updateProduct error:', err);
    return res
      .status(500)
      .json({ message: 'Server error', error: String(err.message || err) });
  }
};

// DELETE /api/products/:id
exports.deleteProduct = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id))
      return res.status(400).json({ message: 'Invalid id' });

    const result = await pool.query(
      `DELETE FROM public."Product" WHERE "Id" = $1 RETURNING "Id" AS id`,
      [id]
    );

    if (result.rowCount === 0)
      return res.status(404).json({ message: 'Product not found' });
    return res.json({ message: 'Deleted', id: result.rows[0].id });
  } catch (err) {
    console.error('deleteProduct error:', err);
    return res
      .status(500)
      .json({ message: 'Server error', error: String(err.message || err) });
  }
};

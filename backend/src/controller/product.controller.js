const pool = require('../config/database');
console.log('🔥 NEW PRODUCT CONTROLLER LOADED');

// helper: สร้าง code จาก running number
const makeProductCode = (num) => `P${String(num).padStart(3, '0')}`;

// GET /api/products?search=...
exports.getAllProducts = async (req, res) => {
  try {
    const search = (req.query.search || '').trim();

    let sql = `
      SELECT
        p."Id" AS id,
        p.code,
        p.name,
        p.category,
        p.price,
        COALESCE(pu.total_quantity, 0) AS quantity,
        p.image
      FROM public."Product" p
      LEFT JOIN (
        SELECT
          LOWER(TRIM(name)) AS name_key,
          LOWER(TRIM(category)) AS category_key,
          SUM(COALESCE(quantity, 0)) AS total_quantity
        FROM public."Purchase"
        GROUP BY
          LOWER(TRIM(name)),
          LOWER(TRIM(category))
      ) pu
        ON LOWER(TRIM(p.name)) = pu.name_key
       AND LOWER(TRIM(p.category)) = pu.category_key
    `;

    const params = [];

    if (search) {
      sql += `
        WHERE p.name ILIKE $1
           OR p.code ILIKE $1
           OR p.category ILIKE $1
      `;
      params.push(`%${search}%`);
    }

    sql += ` ORDER BY p."Id" DESC`;

    const result = await pool.query(sql, params);
    console.log('getAllProducts result =', result.rows);

    res.status(200).json(result.rows);
  } catch (err) {
    console.error('getAllProducts error:', err.message);
    res.status(500).json({ message: err.message });
  }
};

// GET /api/products/:id
exports.getProductById = async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id)) {
      return res.status(400).json({ message: 'Invalid id' });
    }

    const result = await pool.query(
      `
      SELECT
        p."Id" AS id,
        p.code,
        p.name,
        p.category,
        p.price,
        COALESCE(pu.total_quantity, 0) AS quantity,
        p.image
      FROM public."Product" p
      LEFT JOIN (
        SELECT
          LOWER(TRIM(name)) AS name_key,
          LOWER(TRIM(category)) AS category_key,
          SUM(COALESCE(quantity, 0)) AS total_quantity
        FROM public."Purchase"
        GROUP BY
          LOWER(TRIM(name)),
          LOWER(TRIM(category))
      ) pu
        ON LOWER(TRIM(p.name)) = pu.name_key
       AND LOWER(TRIM(p.category)) = pu.category_key
      WHERE p."Id" = $1
      `,
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

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
  const client = await pool.connect();

  try {
    const { name, category, price } = req.body;

    if (!name || !String(name).trim()) {
      return res.status(400).json({ message: 'name is required' });
    }

    if (!category || !String(category).trim()) {
      return res.status(400).json({ message: 'category is required' });
    }

    if (
      price === undefined ||
      price === null ||
      Number(price) <= 0 ||
      Number.isNaN(Number(price))
    ) {
      return res.status(400).json({ message: 'price must be > 0' });
    }

    const cleanName = String(name).trim();
    const cleanCategory = String(category).trim();
    const cleanPrice = Number(price);
    const image = req.file ? `/uploads/${req.file.filename}` : null;

    await client.query('BEGIN');

    await client.query(`LOCK TABLE public."Product" IN EXCLUSIVE MODE`);

    const lastCodeResult = await client.query(`
      SELECT COALESCE(MAX(CAST(SUBSTRING("code" FROM 2) AS INTEGER)), 0) AS last_code_num
      FROM public."Product"
      WHERE "code" IS NOT NULL AND "code" ~ '^P[0-9]+$'
    `);

    const nextNumber = Number(lastCodeResult.rows[0].last_code_num) + 1;
    const code = makeProductCode(nextNumber);

    const result = await client.query(
      `
      INSERT INTO public."Product" ("code", "name", "category", "price", "image")
      VALUES ($1, $2, $3, $4, $5)
      RETURNING
        "Id" AS id,
        "code" AS code,
        "name" AS name,
        "category" AS category,
        "price" AS price,
        0 AS quantity,
        "image" AS image
      `,
      [code, cleanName, cleanCategory, cleanPrice, image]
    );

    await client.query('COMMIT');

    return res.status(201).json(result.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('createProduct error:', err);

    if (err.code === '23505') {
      return res.status(409).json({ message: 'Product code already exists' });
    }

    return res
      .status(500)
      .json({ message: 'Server error', error: String(err.message || err) });
  } finally {
    client.release();
  }
};

// PUT /api/products/:id
exports.updateProduct = async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id)) {
      return res.status(400).json({ message: 'Invalid id' });
    }

    const { name, category, price } = req.body;

    const sets = [];
    const params = [];

    const add = (col, val) => {
      params.push(val);
      sets.push(`${col} = $${params.length}`);
    };

    if (name !== undefined) {
      if (!String(name).trim()) {
        return res.status(400).json({ message: 'name is invalid' });
      }
      add(`"name"`, String(name).trim());
    }

    if (category !== undefined) {
      if (!String(category).trim()) {
        return res.status(400).json({ message: 'category is invalid' });
      }
      add(`"category"`, String(category).trim());
    }

    if (price !== undefined) {
      if (Number(price) <= 0 || Number.isNaN(Number(price))) {
        return res.status(400).json({ message: 'price must be > 0' });
      }
      add(`"price"`, Number(price));
    }

    if (req.file) {
      add(`"image"`, `/uploads/${req.file.filename}`);
    }

    if (sets.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    params.push(id);

    const sql = `
      UPDATE public."Product"
      SET ${sets.join(', ')}
      WHERE "Id" = $${params.length}
      RETURNING
        "Id" AS id,
        "code" AS code,
        "name" AS name,
        "category" AS category,
        "price" AS price,
        "image" AS image
    `;

    const result = await pool.query(sql, params);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

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

    if (!Number.isInteger(id)) {
      return res.status(400).json({ message: 'Invalid id' });
    }

    const result = await pool.query(
      `
      DELETE FROM public."Product"
      WHERE "Id" = $1
      RETURNING "Id" AS id, "code" AS code
      `,
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    return res.json({
      message: 'Deleted',
      id: result.rows[0].id,
      code: result.rows[0].code,
    });
  } catch (err) {
    console.error('deleteProduct error:', err);
    return res
      .status(500)
      .json({ message: 'Server error', error: String(err.message || err) });
  }
};
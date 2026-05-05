const pool = require('../config/database');

/* ================= GET ALL ================= */
exports.getAllPurchase = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        id,
        code,
        name,
        category,
        quantity,
        price,
        create_date
      FROM public."Purchase"
      ORDER BY create_date DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('getAllPurchase error:', err);
    res.status(500).json({ error: 'โหลดข้อมูลไม่สำเร็จ' });
  }
};

/* ================= CREATE ================= */
exports.createPurchase = async (req, res) => {
  const client = await pool.connect();
  try {
    console.log('createPurchase req.body =', req.body);

    const { code, name, category, quantity, price } = req.body;

    await client.query('BEGIN');

    // 1. Insert into Purchase
    const result = await client.query(
      `
      INSERT INTO public."Purchase"
      (code, name, category, quantity, price, create_date)
      VALUES ($1, $2, $3, $4, $5, now())
      RETURNING id, code, name, category, quantity, price, create_date
      `,
      [code, name, category, quantity, price]
    );

    console.log('createPurchase inserted row =', result.rows[0]);

    // 2. Update Inventory: add quantity and update date (matched by code)
    const invResult = await client.query(
      `
      UPDATE public."Inventory"
      SET quantity = quantity + $1,
          update_date = now()
      WHERE code = $2
      RETURNING id, code, quantity, update_date
      `,
      [quantity, code]
    );

    if (invResult.rowCount === 0) {
      console.warn(`createPurchase: no Inventory row found for code=${code}`);
    } else {
      console.log('createPurchase updated Inventory row =', invResult.rows[0]);
    }

    await client.query('COMMIT');

    res.status(201).json(result.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('createPurchase error:', err);
    res.status(500).json({ error: 'เพิ่มข้อมูลไม่สำเร็จ' });
  } finally {
    client.release();
  }
};
/* ================= UPDATE ================= */
exports.updatePurchase = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('updatePurchase id =', id);
    console.log('updatePurchase req.body =', req.body);

    const { code, name, category, quantity, price, date } = req.body;

    const result = await pool.query(
      `
      UPDATE public."Purchase"
      SET
        code = $1,
        name = $2,
        category = $3,
        quantity = $4,
        price = $5,
        date = $6
      WHERE id = $7
      RETURNING *
      `,
      [code, name, category, quantity, price, date, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'ไม่พบข้อมูล' });
    }

    console.log('updatePurchase updated =', result.rows[0]);

    res.json(result.rows[0]);
  } catch (err) {
    console.error('updatePurchase error:', err);
    res.status(500).json({ error: 'แก้ไขไม่สำเร็จ' });
  }
};

/* ================= DELETE ================= */
exports.deletePurchase = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('deletePurchase id =', id);

    const result = await pool.query(
      `DELETE FROM public."Purchase" WHERE id = $1 RETURNING *`,
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'ไม่พบข้อมูล' });
    }

    console.log('deletePurchase deleted =', result.rows[0]);

    res.json({ message: 'ลบสำเร็จ' });
  } catch (err) {
    console.error('deletePurchase error:', err);
    res.status(500).json({ error: 'ลบไม่สำเร็จ' });
  }
};

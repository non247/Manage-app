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
        date
      FROM public."Purchase"
      ORDER BY id DESC
    `);

    console.log('getAllPurchase result =', result.rows);

    res.json(result.rows);
  } catch (err) {
    console.error('getAllPurchase error:', err);
    res.status(500).json({ error: 'โหลดข้อมูลไม่สำเร็จ' });
  }
};

/* ================= CREATE ================= */
exports.createPurchase = async (req, res) => {
  try {
    console.log('createPurchase req.body =', req.body);

    const { code, name, category, quantity, price, date } = req.body;

    const result = await pool.query(
      `
      INSERT INTO public."Purchase"
      (code, name, category, quantity, price, date)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, code, name, category, quantity, price, date
      `,
      [code, name, category, quantity, price, date]
    );

    console.log('createPurchase inserted row =', result.rows[0]);

    const check = await pool.query(
      `SELECT id, code, name, category, quantity, price, date
       FROM public."Purchase"
       WHERE id = $1`,
      [result.rows[0].id]
    );

    console.log('createPurchase recheck row =', check.rows[0]);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('createPurchase error:', err);
    res.status(500).json({ error: 'เพิ่มข้อมูลไม่สำเร็จ' });
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
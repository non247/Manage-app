const pool = require('../config/database');

/* ================= GET ALL ================= */
exports.getAllPurchase = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        id,
        name,
        category,
        quantity,
        price,
        date
      FROM public."Purchase"
      ORDER BY id DESC
    `);

    res.json(result.rows);
  } catch (err) {
    console.error('getAllPurchase error:', err);
    res.status(500).json({ error: 'โหลดข้อมูลไม่สำเร็จ' });
  }
};

/* ================= CREATE ================= */
exports.createPurchase = async (req, res) => {
  try {
    const { name, category, quantity, price, date } = req.body;

    const result = await pool.query(
      `
      INSERT INTO public."Purchase"
      (name, category, quantity, price, date)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
      `,
      [name, category, quantity, price, date]
    );

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
    const { name, category, quantity, price, date } = req.body;

    const result = await pool.query(
      `
      UPDATE public."Purchase"
      SET
        name = $1,
        category = $2,
        quantity = $3,
        price = $4,
        date = $5
      WHERE id = $6
      RETURNING *
      `,
      [name, category, quantity, price, date, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'ไม่พบข้อมูล' });
    }

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

    const result = await pool.query(
      `DELETE FROM public."Purchase" WHERE id = $1 RETURNING *`,
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'ไม่พบข้อมูล' });
    }

    res.json({ message: 'ลบสำเร็จ' });
  } catch (err) {
    console.error('deletePurchase error:', err);
    res.status(500).json({ error: 'ลบไม่สำเร็จ' });
  }
};

const pool = require('../config/database');

/* ================= GET ALL ================= */
exports.getHistoryPurchase = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT *
      FROM "History_Purchase"
      ORDER BY id DESC
    `);

    res.status(200).json(result.rows);
  } catch (err) {
    console.error('GET History_Purchase error:', err);
    res.status(500).json({ message: err.message });
  }
};

/* ================= CREATE ================= */
exports.createHistoryPurchase = async (req, res) => {
  try {
    const { name, category, quantity, price, date } = req.body;

    // validate
    if (!name || !category || quantity == null || price == null || !date) {
      return res.status(400).json({ message: 'ข้อมูลไม่ครบ' });
    }

    const result = await pool.query(
      `
      INSERT INTO "History_Purchase" (name, category, quantity, price, "date")
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
      `,
      [name, category, quantity, price, date]
    );

    res.status(201).json({
      message: 'เพิ่มข้อมูลสำเร็จ',
      data: result.rows[0],
    });
  } catch (err) {
    console.error('CREATE History_Purchase error:', err);
    res.status(500).json({
      message: err.message,
      detail: err.detail || null,
    });
  }
};

/* ================= UPDATE ================= */
exports.updateHistoryPurchase = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category, quantity, price, date } = req.body;

    if (!name || !category || quantity == null || price == null || !date) {
      return res.status(400).json({ message: 'ข้อมูลไม่ครบ' });
    }

    const result = await pool.query(
      `
      UPDATE "History_Purchase"
      SET name = $1,
          category = $2,
          quantity = $3,
          price = $4,
          "date" = $5
      WHERE id = $6
      RETURNING *
      `,
      [name, category, quantity, price, date, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'ไม่พบข้อมูลที่ต้องการแก้ไข' });
    }

    res.status(200).json({
      message: 'แก้ไขข้อมูลสำเร็จ',
      data: result.rows[0],
    });
  } catch (err) {
    console.error('UPDATE History_Purchase error:', err);
    res.status(500).json({
      message: err.message,
      detail: err.detail || null,
    });
  }
};

/* ================= DELETE ================= */
exports.deleteHistoryPurchase = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
      DELETE FROM "History_Purchase"
      WHERE id = $1
      RETURNING *
      `,
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'ไม่พบข้อมูลที่ต้องการลบ' });
    }

    res.status(200).json({ message: 'ลบข้อมูลสำเร็จ' });
  } catch (err) {
    console.error('DELETE History_Purchase error:', err);
    res.status(500).json({
      message: err.message,
      detail: err.detail || null,
    });
  }
};
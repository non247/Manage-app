const pool = require('../config/database');

exports.getHistoryPurchase = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM "History_Purchase"
      ORDER BY id DESC
    `);

    res.status(200).json(result.rows);
  } catch (err) {
    console.error('GET History_Purchase error:', err.message);
    res.status(500).json({ message: err.message });
  }
};

exports.createHistoryPurchase = async (req, res) => {
  try {
    const { name, category, quantity, price, date, image } = req.body;

    await pool.query(
      `
      INSERT INTO "History_Purchase" (name, category, quantity, price, date, image)
      VALUES ($1, $2, $3, $4, $5, $6)
      `,
      [name, category, quantity, price, date, image]
    );

    res.status(201).json({ message: 'เพิ่มข้อมูลสำเร็จ' });
  } catch (err) {
    console.error('CREATE History_Purchase error:', err.message);
    res.status(500).json({ message: err.message });
  }
};

exports.updateHistoryPurchase = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category, quantity, price, date, image } = req.body;

    await pool.query(
      `
      UPDATE "History_Purchase"
      SET name = $1,
          category = $2,
          quantity = $3,
          price = $4,
          "date" = $5,
          image = $6
      WHERE id = $7
      `,
      [name, category, quantity, price, date, image, id]
    );

    res.status(200).json({ message: 'แก้ไขข้อมูลสำเร็จ' });
  } catch (err) {
    console.error('UPDATE History_Purchase error:', err.message);
    res.status(500).json({ message: err.message });
  }
};

exports.deleteHistoryPurchase = async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query(`DELETE FROM "History_Purchase" WHERE id = $1`, [id]);

    res.status(200).json({ message: 'ลบข้อมูลสำเร็จ' });
  } catch (err) {
    console.error('DELETE History_Purchase error:', err.message);
    res.status(500).json({ message: err.message });
  }
};
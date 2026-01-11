const pool = require('../config/database');

exports.getHistory = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM history
      ORDER BY date DESC
    `);

    res.status(200).json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'โหลดข้อมูลประวัติไม่สำเร็จ' });
  }
};


exports.createHistory = async (req, res) => {
  try {
    const { name, category, quantity, price, date } = req.body;

    await pool.query(
      `
      INSERT INTO history (name, category, quantity, price, date)
      VALUES ($1, $2, $3, $4, $5)
      `,
      [name, category, quantity, price, date]
    );

    res.status(201).json({ message: 'เพิ่มข้อมูลสำเร็จ' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'เพิ่มข้อมูลไม่สำเร็จ' });
  }
};


exports.updateHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category, quantity, price, date } = req.body;

    await pool.query(
      `
      UPDATE history
      SET name = $1,
          category = $2,
          quantity = $3,
          price = $4,
          date = $5
      WHERE id = $6
      `,
      [name, category, quantity, price, date, id]
    );

    res.status(200).json({ message: 'แก้ไขข้อมูลสำเร็จ' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'แก้ไขข้อมูลไม่สำเร็จ' });
  }
};


exports.deleteHistory = async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query(
      `DELETE FROM history WHERE id = $1`,
      [id]
    );

    res.status(200).json({ message: 'ลบข้อมูลสำเร็จ' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'ลบข้อมูลไม่สำเร็จ' });
  }
};

const pool = require('../config/database');

exports.getInventory = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM "Inventory"
      ORDER BY id DESC
    `);

    res.status(200).json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'โหลดข้อมูลประวัติไม่สำเร็จ' });
  }
};

exports.createInventory = async (req, res) => {
  try {
    const { name, category, quantity, price, date } = req.body;

    await pool.query(
      `
      INSERT INTO "Inventory" (name, category, quantity, price, date)
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

exports.updateInventory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category, quantity, price, date } = req.body;

    await pool.query(
      `
      UPDATE "Inventory"
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

exports.deleteInventory = async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query(`DELETE FROM "Inventory" WHERE id = $1`, [id]);

    res.status(200).json({ message: 'ลบข้อมูลสำเร็จ' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'ลบข้อมูลไม่สำเร็จ' });
  }
};

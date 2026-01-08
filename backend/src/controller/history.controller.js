const { poolPromise } = require('../config/database');
exports.getHistory = async (req, res) => {
  try {
    const pool = await poolPromise;

    const result = await pool.request().query();

    res.status(200).json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'โหลดข้อมูลประวัติไม่สำเร็จ' });
  }
};

exports.createHistory = async (req, res) => {
  try {
    const { name, category, quantity, price, date } = req.body;
    const pool = await poolPromise;

    await pool
      .request()
      .input('name', name)
      .input('category', category)
      .input('quantity', quantity)
      .input('price', price)
      .input('date', date)
      .query();

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
    const pool = await poolPromise;

    await pool
      .request()
      .input('id', id)
      .input('name', name)
      .input('category', category)
      .input('quantity', quantity)
      .input('price', price)
      .input('date', date)
      .query();

    res.status(200).json({ message: 'แก้ไขข้อมูลสำเร็จ' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'แก้ไขข้อมูลไม่สำเร็จ' });
  }
};

exports.deleteHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await poolPromise;

    await pool
      .request()
      .input()
      .query();

    res.status(200).json({ message: 'ลบข้อมูลสำเร็จ' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'ลบข้อมูลไม่สำเร็จ' });
  }
};

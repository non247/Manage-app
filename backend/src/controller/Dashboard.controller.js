const pool = require('../config/database');

exports.getDashboard = async (req, res) => {
  try {
    // 1️⃣ ยอดขายวันนี้
    const todaySalesResult = await pool.query(`
      SELECT COALESCE(SUM(price * quantity), 0) AS today_sales
      FROM "History"
      WHERE DATE(date) = CURRENT_DATE
    `);

    // ✅ วันนี้กี่ "รายการ" (จำนวนแถว)
    const todayItemsResult = await pool.query(`
      SELECT COUNT(*) AS today_items
      FROM "History"
      WHERE DATE(date) = CURRENT_DATE
    `);

    // 2️⃣ จำนวนสินค้าทั้งหมด
    const totalProductsResult = await pool.query(`
      SELECT COUNT(name) AS total_products
      FROM "History"
    `);

    // จำนวนสินค้าทั้งหมดที่ขายได้
    const totalSoldResult = await pool.query(`
      SELECT COALESCE(SUM(quantity), 0) AS total_sold
      FROM "History"
      WHERE DATE(date) = CURRENT_DATE
    `);

    // 3️⃣ กราฟยอดขายรายวัน
    const salesChartResult = await pool.query(`
      SELECT 
        DATE(date) AS date,
        SUM(price * quantity) AS total
      FROM "History"
      GROUP BY DATE(date)
      ORDER BY date
    `);

    // 4️⃣ สินค้าขายดีที่สุด
    const topSellerResult = await pool.query(`
        SELECT 
    name,
    SUM(quantity) AS sold,
    SUM(price * quantity) AS total_sales
  FROM "History"
  GROUP BY name
  ORDER BY total_sales DESC
  LIMIT 5
    `);

    const productChartResult = await pool.query(`
         SELECT 
    name,
    SUM(quantity) AS sold,
    SUM(price * quantity) AS total_sales
  FROM "History"
  GROUP BY name
  ORDER BY total_sales DESC
`);

    res.status(200).json({
      todaySales: Number(todaySalesResult.rows[0].today_sales),
      todayProducts: Number(todayItemsResult.rows[0].today_items),
      totalProducts: Number(totalProductsResult.rows[0].total_products),
      totalSold: Number(totalSoldResult.rows[0].total_sold),
      salesChart: salesChartResult.rows,
      topSellers: topSellerResult.rows,
      productChart: productChartResult.rows,
    });
  } catch (error) {
    console.error('❌ Dashboard API Error:', error.message);
    res.status(500).json({ error: error.message });
  }
};

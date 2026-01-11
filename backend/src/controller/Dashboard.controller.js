// const pool = require('../config/database');


// exports.getDashboard = async (req, res) => {
//   try {

//     const todaySalesResult = await pool.query();

//     const totalProductsResult = await pool.query();


//     const salesChartResult = await pool.query();


//     const topSellerResult = await pool.query();

//     res.json({
//       todaySales: todaySalesResult.rows[0].today_sales,
//       totalProducts: totalProductsResult.rows[0].total_products,
//       salesChart: salesChartResult.rows,
//       topSellers: topSellerResult.rows
//     });

//   } catch (error) {
//     console.error("Error executing query:", error);
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// };

const pool = require('../config/database');

exports.getDashboard = async (req, res) => {
  try {

    // 1️⃣ ยอดขายวันนี้
    const todaySalesResult = await pool.query(`
      SELECT COALESCE(SUM(total_price), 0) AS today_sales
      FROM orders
      WHERE DATE(order_date) = CURRENT_DATE
    `);

    // 2️⃣ จำนวนสินค้าทั้งหมด
    const totalProductsResult = await pool.query(`
      SELECT COUNT(*) AS total_products
      FROM products
    `);

    // 3️⃣ กราฟยอดขาย (รายวัน)
    const salesChartResult = await pool.query(`
      SELECT 
        DATE(order_date) AS date,
        SUM(total_price) AS total
      FROM orders
      GROUP BY DATE(order_date)
      ORDER BY date
    `);

    // 4️⃣ สินค้าขายดีที่สุด
    const topSellerResult = await pool.query(`
      SELECT 
        p.name,
        SUM(oi.quantity) AS sold
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      GROUP BY p.name
      ORDER BY sold DESC
      LIMIT 5
    `);

    res.status(200).json({
      todaySales: todaySalesResult.rows[0].today_sales,
      totalProducts: totalProductsResult.rows[0].total_products,
      salesChart: salesChartResult.rows,
      topSellers: topSellerResult.rows
    });

  } catch (error) {
    console.error('Error executing dashboard query:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

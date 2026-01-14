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
    console.log('🔥 NEW DASHBOARD CONTROLLER IS RUNNING 🔥'); 

    // throw new Error('🔥 NEW DASHBOARD CONTROLLER IS RUNNING 🔥');
    // 1️⃣ ยอดขายวันนี้
    const todaySalesResult = await pool.query(`
      SELECT COALESCE(SUM(price * quantity), 0) AS today_sales
      FROM "History"
      WHERE DATE(date) = CURRENT_DATE
    `);

    // 2️⃣ จำนวนสินค้าทั้งหมด
    const totalProductsResult = await pool.query(`
      SELECT COUNT(DISTINCT name) AS total_products
      FROM "History"
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
        SUM(quantity) AS sold
      FROM "History"
      GROUP BY name
      ORDER BY sold DESC
      LIMIT 5
    `);

    const productChartResult = await pool.query(`
  SELECT 
    name,
    SUM(quantity) AS sold
  FROM "History"
  GROUP BY name
  ORDER BY sold DESC;
`);


    res.status(200).json({
      todaySales: Number(todaySalesResult.rows[0].today_sales),
      totalProducts: Number(totalProductsResult.rows[0].total_products),
      salesChart: salesChartResult.rows,
      topSellers: topSellerResult.rows,
      productChart: productChartResult.rows
    });

  } catch (error) {
    console.error('❌ Dashboard API Error:', error.message);
    res.status(500).json({ error: error.message });
  }
};

// const pool = require('../config/database');

// exports.getDashboard = async (req, res) => {
//   try {

//     // 1️⃣ ยอดขายวันนี้
//     const todaySalesResult = await pool.query(`
//       SELECT COALESCE(SUM(price * quantity), 0) AS today_sales
//       FROM "History"
//       WHERE DATE(date) = CURRENT_DATE
//     `);

//     // 2️⃣ จำนวนสินค้าทั้งหมด
//     const totalProductsResult = await pool.query(`
//       SELECT COUNT(DISTINCT name) AS total_products
//       FROM "History"
//     `);

//     // 3️⃣ กราฟยอดขายรายวัน
//     const salesChartResult = await pool.query(`
//       SELECT 
//         DATE(date) AS date,
//         SUM(price * quantity) AS total
//       FROM "History"
//       GROUP BY DATE(date)
//       ORDER BY date
//     `);

//     // 4️⃣ Top 5 สินค้าขายดี
//     const topSellerResult = await pool.query(`
//       SELECT 
//         name,
//         SUM(quantity) AS sold
//       FROM "History"
//       GROUP BY name
//       ORDER BY sold DESC
//       LIMIT 5
//     `);

//     // 5️⃣ กราฟสินค้าทุกชิ้น
//     const productChartResult = await pool.query(`
//       SELECT 
//         name,
//         SUM(quantity) AS sold
//       FROM "History"
//       GROUP BY name
//       ORDER BY sold DESC
//     `);

//     // 🔥 🔥 🔥 ใส่ตรงนี้
//     const productChart = productChartResult.rows.map(row => ({
//       name: row.name,
//       sold: Number(row.sold)
//     }));

//     const topSellers = topSellerResult.rows.map(row => ({
//       name: row.name,
//       sold: Number(row.sold)
//     }));

//     const salesChart = salesChartResult.rows.map(row => ({
//       date: row.date,
//       total: Number(row.total)
//     }));

//     // 🔥 ส่งค่าออกไป
//     res.status(200).json({
//       todaySales: Number(todaySalesResult.rows[0].today_sales),
//       totalProducts: Number(totalProductsResult.rows[0].total_products),
//       salesChart,
//       topSellers,
//       productChart
//     });

//   } catch (error) {
//     console.error('❌ Dashboard API Error:', error.message);
//     res.status(500).json({ error: error.message });
//   }
// };

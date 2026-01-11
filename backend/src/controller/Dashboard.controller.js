const pool = require('../config/database');


exports.getDashboard = async (req, res) => {
  try {

    const todaySalesResult = await pool.query();

    const totalProductsResult = await pool.query();


    const salesChartResult = await pool.query();


    const topSellerResult = await pool.query();

    res.json({
      todaySales: todaySalesResult.rows[0].today_sales,
      totalProducts: totalProductsResult.rows[0].total_products,
      salesChart: salesChartResult.rows,
      topSellers: topSellerResult.rows
    });

  } catch (error) {
    console.error("Error executing query:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// const { poolPromise } = require("../config/database");
// // const Type = require("mssql").TYPES;
// // const sql = require("mssql");


// exports.dashboard = async (req, res) => {
//   console.log(req.body)
//   try {
//     const pool = await poolPromise;
//     const result = await pool
//     .request()
//     // .query("SELECT * FROM [dbo].[View_CuttingTool_RequestList]");

//     res.json(result.recordset);
//   } 
//   catch (error) {
//     console.error("Error executing query:", error.stack);
//     res.status(500).json({ error: "Internal Server Error", details: error.message });
//   }
 
// };

const { poolPromise } = require('../config/database');

exports.getDashboard = async (req, res) => {
  try {
    const pool = await poolPromise;

    const todaySalesResult = await pool.request().query();

    const totalProductsResult = await pool.request().query();

    const salesChartResult = await pool.request().query();

    const topSellerResult = await pool.request().query();


 res.json(result.recordset);
  } 
  catch (error) {
    console.error('Dashboard Error:', error);
    res.status(500).json({
      message: 'เกิดข้อผิดพลาดในการโหลดข้อมูล Dashboard'
    });
  }
};

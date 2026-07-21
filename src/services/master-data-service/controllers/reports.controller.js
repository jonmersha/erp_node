import pool from '../../../config/db.config.js';

export const getExecutiveReport = async (req, res) => {
  try {
    const companyId = req.user.company_id || req.user.companyId;

    // Sales total
    const [salesResult] = await pool.query(
      `SELECT SUM(total_amount) as totalSales FROM sales_orders WHERE company_id = ? AND status IN ('delivered', 'shipped', 'paid', 'confirmed')`,
      [companyId]
    );

    // Active Production runs
    const [prodResult] = await pool.query(
      `SELECT COUNT(*) as activeRuns FROM production_runs WHERE company_id = ? AND status = 'in_progress'`,
      [companyId]
    );

    // Total Inventory items
    const [invResult] = await pool.query(
      `SELECT SUM(quantity) as totalItems FROM inventory WHERE company_id = ?`,
      [companyId]
    );

    // Total Employees
    const [hrResult] = await pool.query(
      `SELECT COUNT(*) as totalEmployees FROM employees WHERE company_id = ?`,
      [companyId]
    );

    res.json({
      success: true,
      data: {
        totalSales: salesResult[0]?.totalSales || 0,
        activeRuns: prodResult[0]?.activeRuns || 0,
        totalInventoryItems: invResult[0]?.totalItems || 0,
        totalEmployees: hrResult[0]?.totalEmployees || 0
      }
    });
  } catch (error) {
    console.error('Executive Report Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getSalesReport = async (req, res) => {
  try {
    const companyId = req.user.company_id || req.user.companyId;

    const [monthlySales] = await pool.query(`
      SELECT DATE_FORMAT(created_at, '%Y-%m') as month, SUM(total_amount) as revenue
      FROM sales_orders
      WHERE company_id = ?
      GROUP BY month
      ORDER BY month DESC
      LIMIT 6
    `, [companyId]);

    const [statusCounts] = await pool.query(`
      SELECT status, COUNT(*) as count
      FROM sales_orders
      WHERE company_id = ?
      GROUP BY status
    `, [companyId]);

    res.json({
      success: true,
      data: {
        monthlySales: monthlySales.reverse(),
        statusCounts
      }
    });
  } catch (error) {
    console.error('Sales Report Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getProductionReport = async (req, res) => {
  try {
    const companyId = req.user.company_id || req.user.companyId;

    const [statusCounts] = await pool.query(`
      SELECT status, COUNT(*) as count
      FROM production_runs
      WHERE company_id = ?
      GROUP BY status
    `, [companyId]);

    const [factoryOutput] = await pool.query(`
      SELECT f.name as factory, SUM(pr.quantity_produced) as output
      FROM production_runs pr
      JOIN factories f ON pr.factory_id = f.id
      WHERE pr.company_id = ? AND pr.status = 'completed'
      GROUP BY f.id
    `, [companyId]);

    res.json({
      success: true,
      data: {
        statusCounts,
        factoryOutput
      }
    });
  } catch (error) {
    console.error('Production Report Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getInventoryReport = async (req, res) => {
  try {
    const companyId = req.user.company_id || req.user.companyId;

    const [typeCounts] = await pool.query(`
      SELECT item_type, SUM(quantity) as total_quantity
      FROM inventory
      WHERE company_id = ?
      GROUP BY item_type
    `, [companyId]);

    const [lowStock] = await pool.query(`
      SELECT id, item_id, item_type, quantity
      FROM inventory
      WHERE company_id = ? AND quantity < 50
      LIMIT 10
    `, [companyId]);

    res.json({
      success: true,
      data: {
        inventoryByType: typeCounts,
        lowStockAlerts: lowStock
      }
    });
  } catch (error) {
    console.error('Inventory Report Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getHrReport = async (req, res) => {
  try {
    const companyId = req.user.company_id || req.user.companyId;

    const [deptCounts] = await pool.query(`
      SELECT d.name as department, COUNT(e.id) as count
      FROM employees e
      LEFT JOIN departments d ON e.department_id = d.id
      WHERE e.company_id = ?
      GROUP BY e.department_id
    `, [companyId]);

    const [leaveRequests] = await pool.query(`
      SELECT type, COUNT(*) as count
      FROM leave_requests
      WHERE company_id = ? AND status = 'pending'
      GROUP BY type
    `, [companyId]);

    res.json({
      success: true,
      data: {
        employeesByDepartment: deptCounts,
        pendingLeaves: leaveRequests
      }
    });
  } catch (error) {
    console.error('HR Report Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

import pool from './src/config/db.config.js';

async function test() {
  try {
    const [rows] = await pool.query(
      'SELECT id, company_id as companyId, year, quarter, target_revenue as targetRevenue, target_expense as targetExpense, status, created_by as createdBy, approved_by as approvedBy FROM financial_plans WHERE company_id = ? ORDER BY year DESC, quarter DESC',
      ['1']
    );
    console.log('Query success', rows.length);
  } catch (err) {
    console.error('Query error:', err);
  }
  process.exit(0);
}
test();

import pool from './src/config/db.config.js';

async function run() {
  const [rows] = await pool.query("SELECT uid, email, roles FROM users WHERE email LIKE '%jonmersha%'");
  console.log(rows);
  process.exit(0);
}
run();

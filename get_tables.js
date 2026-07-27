import pool from './src/config/db.config.js';
async function run() {
  const [tables] = await pool.query("SHOW TABLES");
  console.log(tables);
  process.exit(0);
}
run();

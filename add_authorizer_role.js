import pool from './src/config/db.config.js';
import crypto from 'node:crypto';

async function run() {
  try {
    const roleId = crypto.randomUUID();
    const permissions = {
      procurement: ["read", "write", "approve"],
      sales: ["read", "write", "approve"],
      finance: ["read", "write", "approve"],
      inventory: ["read", "write", "approve"],
      hr: ["read", "write", "approve"]
    };
    
    // Check if Authorizer already exists
    const [existing] = await pool.query("SELECT * FROM roles WHERE name = 'Authorizer'");
    if (existing.length > 0) {
      console.log("Authorizer role already exists!");
      return;
    }

    await pool.query(
      'INSERT INTO roles (id, name, description, permissions, is_system, company_id) VALUES (?, ?, ?, ?, ?, ?)',
      [roleId, 'Authorizer', 'Can authorize and approve pending records across modules', JSON.stringify(permissions), 1, '39eeefea-8f69-4d55-8f97-e10f130ca68d']
    );
    console.log("Authorizer role added successfully!");
  } catch(e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}
run();

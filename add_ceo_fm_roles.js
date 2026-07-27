import pool from './src/config/db.config.js';
import crypto from 'node:crypto';

async function run() {
  try {
    const permissions = {
      procurement: ["read", "write", "approve"],
      sales: ["read", "write", "approve"],
      finance: ["read", "write", "approve"],
      inventory: ["read", "write", "approve"],
      hr: ["read", "write", "approve"],
      production: ["read", "write", "approve"],
      quality: ["read", "write", "approve"]
    };
    
    const companyId = '39eeefea-8f69-4d55-8f97-e10f130ca68d';
    
    // CEO Role
    const [existingCEO] = await pool.query("SELECT * FROM roles WHERE name = 'CEO'");
    if (existingCEO.length === 0) {
      await pool.query(
        'INSERT INTO roles (id, name, description, permissions, is_system, company_id) VALUES (?, ?, ?, ?, ?, ?)',
        [crypto.randomUUID(), 'CEO', 'Chief Executive Officer with full authorization rights', JSON.stringify(permissions), 1, companyId]
      );
      console.log("CEO role added successfully!");
    } else {
      console.log("CEO role already exists!");
    }

    // Factory Manager Role
    const [existingFM] = await pool.query("SELECT * FROM roles WHERE name = 'Factory Manager'");
    if (existingFM.length === 0) {
      await pool.query(
        'INSERT INTO roles (id, name, description, permissions, is_system, company_id) VALUES (?, ?, ?, ?, ?, ?)',
        [crypto.randomUUID(), 'Factory Manager', 'Factory Manager with authorization rights for factory operations', JSON.stringify(permissions), 1, companyId]
      );
      console.log("Factory Manager role added successfully!");
    } else {
      console.log("Factory Manager role already exists!");
    }
  } catch(e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}
run();

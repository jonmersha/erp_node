import pool from './src/db.js';

async function migrate() {
  try {
    await pool.query('ALTER TABLE factories ADD COLUMN manager_id VARCHAR(255) NULL;');
    await pool.query('ALTER TABLE factories ADD CONSTRAINT fk_factory_manager FOREIGN KEY (manager_id) REFERENCES users(uid) ON DELETE SET NULL;');
    console.log('Added manager_id to factories');
  } catch (err) {
    if (err.code === 'ER_DUP_FIELDNAME') {
      console.log('manager_id already exists in factories');
    } else {
      console.error('Error adding to factories', err);
    }
  }

  try {
    await pool.query('ALTER TABLE warehouses ADD COLUMN manager_id VARCHAR(255) NULL;');
    await pool.query('ALTER TABLE warehouses ADD CONSTRAINT fk_warehouse_manager FOREIGN KEY (manager_id) REFERENCES users(uid) ON DELETE SET NULL;');
    console.log('Added manager_id to warehouses');
  } catch (err) {
    if (err.code === 'ER_DUP_FIELDNAME') {
      console.log('manager_id already exists in warehouses');
    } else {
      console.error('Error adding to warehouses', err);
    }
  }

  process.exit(0);
}

migrate();

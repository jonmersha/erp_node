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

  const email = process.argv[2];
  if (email) {
    try {
      const [users] = await pool.query('SELECT uid FROM users WHERE email = ?', [email]);
      if (users.length > 0) {
        const uid = users[0].uid;
        await pool.query('UPDATE factories SET manager_id = ?', [uid]);
        await pool.query('UPDATE warehouses SET manager_id = ?', [uid]);
        console.log(`Assigned ${email} (${uid}) as manager to existing factories and warehouses.`);
      } else {
        console.log(`User with email ${email} not found.`);
      }
    } catch (err) {
      console.error('Error assigning manager:', err);
    }
  }

  process.exit(0);
}

migrate();

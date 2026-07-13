import 'dotenv/config';
import pool from '../src/db.js';

const addPermissionsColumn = async () => {
  try {
    console.log('Adding permissions column to roles table...');
    await pool.query(`
      ALTER TABLE roles 
      ADD COLUMN permissions JSON;
    `);
    console.log('Successfully added permissions column.');
  } catch (err) {
    if (err.code === 'ER_DUP_FIELDNAME') {
      console.log('Permissions column already exists.');
    } else {
      console.error('Error adding permissions column:', err);
    }
  } finally {
    process.exit(0);
  }
};

addPermissionsColumn();

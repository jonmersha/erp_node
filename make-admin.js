import pool from './src/config/db.config.js';

const email = process.argv[2];

if (!email) {
  console.error('Please provide an email address. Usage: node make-admin.js <email>');
  process.exit(1);
}

async function makeAdmin() {
  try {
    const [users] = await pool.query('SELECT uid, name, email, roles FROM users WHERE email = ?', [email]);
    
    if (users.length === 0) {
      console.error(`User with email ${email} not found in the ERP database.`);
      process.exit(1);
    }
    
    const user = users[0];
    let roles = [];
    
    // Check if roles is a string or array
    try {
      roles = typeof user.roles === 'string' ? JSON.parse(user.roles || '[]') : (user.roles || []);
    } catch(e) {
      roles = [];
    }
    
    if (!roles.includes('admin')) {
      roles.push('admin');
      await pool.query('UPDATE users SET roles = ? WHERE uid = ?', [JSON.stringify(roles), user.uid]);
      console.log(`Successfully added 'admin' role to user ${user.name} (${email}).`);
    } else {
      console.log(`User ${user.name} (${email}) is already an admin.`);
    }
  } catch(e) {
    console.error('Error updating user:', e);
  } finally {
    process.exit();
  }
}

makeAdmin();

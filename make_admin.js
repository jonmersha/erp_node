import pool from './src/db.js';
import crypto from 'node:crypto';

const makeAdmin = async () => {
  const email = process.argv[2];
  
  if (!email) {
    console.error('Please provide an email address.');
    console.log('Usage: node make_admin.js <email>');
    process.exit(1);
  }

  try {
    // 1. Find the user in the database
    const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    
    if (users.length === 0) {
      console.error(`User with email ${email} not found in the database.`);
      console.log('Please ensure the user has signed in to the application at least once so their profile is created.');
      process.exit(1);
    }

    const user = users[0];
    let roles = [];
    
    // Parse existing roles
    if (user.roles) {
      roles = typeof user.roles === 'string' ? JSON.parse(user.roles) : user.roles;
    }

    // Add 'admin' role if it doesn't exist
    if (!roles.includes('admin')) {
      roles.push('admin');
      
      await pool.query('UPDATE users SET roles = ? WHERE email = ?', [JSON.stringify(roles), email]);
      console.log(`Successfully granted 'admin' privileges to user: ${email}.`);
    } else {
      console.log(`User ${email} is already an admin.`);
    }

    // 2. Ensure 'admin' role exists in the roles table so it shows up in dropdowns
    const companyId = user.company_id;
    if (companyId) {
      const [existingRoles] = await pool.query('SELECT id FROM roles WHERE name = "admin" AND company_id = ?', [companyId]);
      
      if (existingRoles.length === 0) {
        const roleId = crypto.randomUUID();
        
        // Admin role doesn't need specific permissions listed because the system automatically 
        // grants full access to anyone with the role name 'admin'
        await pool.query(
          'INSERT INTO roles (id, name, description, company_id, is_system, permissions) VALUES (?, ?, ?, ?, ?, ?)',
          [roleId, 'admin', 'System Administrator with full access to all modules', companyId, true, JSON.stringify({})]
        );
        console.log(`Registered 'admin' role globally for company ID: ${companyId}.`);
      }
    }

    process.exit(0);
  } catch (error) {
    console.error('Error making user admin:', error);
    process.exit(1);
  }
};

makeAdmin();

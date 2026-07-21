import pool from './src/config/db.config.js';

async function run() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS \`local_auth_users\` (
      \`id\` char(36) NOT NULL,
      \`username\` varchar(255) NOT NULL,
      \`email\` varchar(255) NOT NULL,
      \`password_hash\` varchar(255) NOT NULL,
      \`is_verified\` tinyint(1) DEFAULT '0',
      \`verification_token\` varchar(255) DEFAULT NULL,
      \`created_at\` datetime DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (\`id\`),
      UNIQUE KEY \`uk_username\` (\`username\`),
      UNIQUE KEY \`uk_email\` (\`email\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
  `);
  console.log("Created local_auth_users table");
  process.exit(0);
}

run();

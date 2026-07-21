import pool from './src/config/db.config.js';

async function run() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS \`oidc_payloads\` (
      \`id\` varchar(255) NOT NULL,
      \`type\` varchar(255) NOT NULL,
      \`payload\` json NOT NULL,
      \`grantId\` varchar(255) DEFAULT NULL,
      \`userCode\` varchar(255) DEFAULT NULL,
      \`uid\` varchar(255) DEFAULT NULL,
      \`expiresAt\` datetime DEFAULT NULL,
      \`consumedAt\` datetime DEFAULT NULL,
      \`createdAt\` datetime DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (\`id\`, \`type\`),
      KEY \`idx_grantId\` (\`grantId\`),
      KEY \`idx_userCode\` (\`userCode\`),
      KEY \`idx_uid\` (\`uid\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
  `);
  console.log("Created oidc_payloads table");
  process.exit(0);
}

run();

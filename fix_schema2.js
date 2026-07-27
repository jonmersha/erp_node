import fs from 'fs';

const path = '/Users/yohannes/Desktop/project/ERP/backend/sql/schema.sql';
let lines = fs.readFileSync(path, 'utf8').split('\n');

const fixedPart = `  PRIMARY KEY (\`id\`),
  KEY \`fk_fixed_asset_company\` (\`company_id\`),
  CONSTRAINT \`fk_fixed_asset_company\` FOREIGN KEY (\`company_id\`) REFERENCES \`companies\` (\`id\`) ON DELETE CASCADE
) ;

CREATE TABLE IF NOT EXISTS \`financial_plans\` (
  \`id\` char(36) NOT NULL,
  \`company_id\` char(36) NOT NULL,
  \`year\` int NOT NULL,
  \`quarter\` enum('Q1','Q2','Q3','Q4') DEFAULT NULL,
  \`target_revenue\` decimal(15,2) DEFAULT NULL,
  \`target_expense\` decimal(15,2) DEFAULT NULL,
  \`status\` enum('draft','approved','rejected','pending_approval') DEFAULT 'draft',
  \`created_by\` varchar(36) DEFAULT NULL,
  \`approved_by\` varchar(36) DEFAULT NULL,
  \`created_at\` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`fk_fin_plan_company\` (\`company_id\`),
  CONSTRAINT \`fk_fin_plan_company\` FOREIGN KEY (\`company_id\`) REFERENCES \`companies\` (\`id\`) ON DELETE CASCADE
) ;

CREATE TABLE IF NOT EXISTS \`fleet_consumptions\` (`;

// Insert the fixed part between line 271 and 272
lines.splice(271, 0, fixedPart);
fs.writeFileSync(path, lines.join('\n'), 'utf8');
console.log('Fixed using array splice!');

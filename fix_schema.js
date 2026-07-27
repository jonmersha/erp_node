import fs from 'fs';

const path = '/Users/yohannes/Desktop/project/ERP/backend/sql/schema.sql';
let content = fs.readFileSync(path, 'utf8');

const regex = /  `depreciation_method` enum\('straight_line','declining_balance'\) DEFAULT 'straight_line',[\s\S]*?`type` enum\('fuel','maintenance','repair','toll'\) NOT NULL,/;

const fixedPart = `  \`depreciation_method\` enum('straight_line','declining_balance') DEFAULT 'straight_line',
  \`status\` enum('active','sold','scrapped','maintenance') DEFAULT 'active',
  \`created_at\` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
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

CREATE TABLE IF NOT EXISTS \`fleet_consumptions\` (
  \`id\` char(36) NOT NULL,
  \`vehicle_id\` char(36) NOT NULL,
  \`type\` enum('fuel','maintenance','repair','toll') NOT NULL,`;

if (regex.test(content)) {
  content = content.replace(regex, fixedPart);
  fs.writeFileSync(path, content, 'utf8');
  console.log('Fixed successfully');
} else {
  console.log('Broken part not found with regex.');
}

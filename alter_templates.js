import pool from './src/db.js';

async function alterDB() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS workflow_templates (
          id CHAR(36) PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          description TEXT,
          company_id CHAR(36) NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;
    `);
    console.log('Created workflow_templates table.');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS workflow_template_stages (
          id CHAR(36) PRIMARY KEY,
          template_id CHAR(36) NOT NULL,
          stage_name VARCHAR(100) NOT NULL,
          stage_order INT NOT NULL,
          estimated_time_minutes INT,
          percentage_weight DECIMAL(5,2),
          company_id CHAR(36) NOT NULL,
          CONSTRAINT fk_template FOREIGN KEY (template_id) REFERENCES workflow_templates(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);
    console.log('Created workflow_template_stages table.');

    // Add workflow_template_id to production_runs
    try {
        await pool.query(`
          ALTER TABLE production_runs ADD COLUMN workflow_template_id CHAR(36);
        `);
        console.log('Added workflow_template_id to production_runs.');
    } catch (e) {
        if (e.code === 'ER_DUP_FIELDNAME') {
            console.log('Column workflow_template_id already exists.');
        } else {
            throw e;
        }
    }

    process.exit(0);
  } catch (error) {
    console.error('Error altering database:', error);
    process.exit(1);
  }
}

alterDB();

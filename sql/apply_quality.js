import pool from '../src/db.js';

const initQuality = async () => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS quality_checks (
                id CHAR(36) PRIMARY KEY,
                reference_id CHAR(36) NOT NULL,
                reference_type ENUM('production_run', 'grn', 'inventory') NOT NULL,
                item_id CHAR(36) NOT NULL,
                inspector_id CHAR(36) NOT NULL,
                check_date DATETIME NOT NULL,
                status ENUM('passed', 'failed', 'pending', 'quarantined') NOT NULL DEFAULT 'pending',
                notes TEXT,
                company_id CHAR(36) NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT fk_qc_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
            ) ENGINE=InnoDB;
        `);
        console.log('Quality checks table created.');
    } catch (error) {
        console.error('Error creating table:', error);
    } finally {
        process.exit();
    }
};

initQuality();

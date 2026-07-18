import pool from '../../../db.js';
import AdmZip from 'adm-zip';
import { stringify } from 'csv-stringify/sync';
import { parse } from 'csv-parse/sync';

export const exportSql = async (req, res) => {
  try {
    const companyId = req.user.company_id || req.user.companyId;
    if (!companyId) return res.status(400).json({ success: false, message: 'Company ID required' });

    const [tablesRow] = await pool.query('SHOW TABLES');
    const tables = tablesRow.map(row => Object.values(row)[0]);

    let sqlDump = `-- Database Backup for Company: ${companyId}\n`;
    sqlDump += `-- Date: ${new Date().toISOString()}\n\n`;
    sqlDump += `SET FOREIGN_KEY_CHECKS = 0;\n\n`;

    for (const table of tables) {
      if (table === 'companies') continue; // Skip companies table

      const [columns] = await pool.query(`SHOW COLUMNS FROM \`${table}\``);
      const hasCompanyId = columns.some(c => c.Field === 'company_id');

      let rows = [];
      if (hasCompanyId) {
        const [result] = await pool.query(`SELECT * FROM \`${table}\` WHERE company_id = ?`, [companyId]);
        rows = result;
      } else {
        const [result] = await pool.query(`SELECT * FROM \`${table}\``);
        rows = result;
      }

      if (rows.length === 0) continue;

      sqlDump += `-- Table: ${table}\n`;
      sqlDump += `DELETE FROM \`${table}\`${hasCompanyId ? ` WHERE company_id = '${companyId}'` : ''};\n`;

      const values = rows.map(row => {
        return '(' + Object.values(row).map(val => {
          if (val === null) return 'NULL';
          if (typeof val === 'number') return val;
          if (val instanceof Date) return pool.escape(val.toISOString().slice(0, 19).replace('T', ' '));
          return pool.escape(val);
        }).join(', ') + ')';
      });

      const chunkSize = 100;
      for (let i = 0; i < values.length; i += chunkSize) {
        const chunk = values.slice(i, i + chunkSize);
        sqlDump += `INSERT INTO \`${table}\` (\`${Object.keys(rows[0]).join('`, `')}\`) VALUES \n${chunk.join(',\n')};\n`;
      }
      sqlDump += `\n`;
    }

    sqlDump += `SET FOREIGN_KEY_CHECKS = 1;\n`;

    res.setHeader('Content-Type', 'application/sql');
    res.setHeader('Content-Disposition', `attachment; filename=backup-${new Date().toISOString().split('T')[0]}.sql`);
    res.send(sqlDump);
  } catch (error) {
    console.error('SQL Export Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const importSql = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const sqlContent = req.file.buffer.toString('utf-8');
    
    await pool.query(sqlContent);

    res.json({ success: true, message: 'SQL Database restored successfully' });
  } catch (error) {
    console.error('SQL Import Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const exportCsv = async (req, res) => {
  try {
    const companyId = req.user.company_id || req.user.companyId;
    if (!companyId) return res.status(400).json({ success: false, message: 'Company ID required' });

    const [tablesRow] = await pool.query('SHOW TABLES');
    const tables = tablesRow.map(row => Object.values(row)[0]);

    const zip = new AdmZip();

    for (const table of tables) {
      if (table === 'companies') continue;
      
      const [columns] = await pool.query(`SHOW COLUMNS FROM \`${table}\``);
      const hasCompanyId = columns.some(c => c.Field === 'company_id');

      let rows = [];
      if (hasCompanyId) {
        const [result] = await pool.query(`SELECT * FROM \`${table}\` WHERE company_id = ?`, [companyId]);
        rows = result;
      } else {
        const [result] = await pool.query(`SELECT * FROM \`${table}\``);
        rows = result;
      }

      if (rows.length === 0) continue;

      const safeRows = rows.map(row => {
        const newRow = { ...row };
        Object.keys(newRow).forEach(key => {
          if (newRow[key] instanceof Date) {
            newRow[key] = newRow[key].toISOString().slice(0, 19).replace('T', ' ');
          }
        });
        return newRow;
      });

      const csvData = stringify(safeRows, { header: true });
      zip.addFile(`${table}.csv`, Buffer.from(csvData, 'utf8'));
    }

    const zipBuffer = zip.toBuffer();
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename=backup-csv-${new Date().toISOString().split('T')[0]}.zip`);
    res.send(zipBuffer);
  } catch (error) {
    console.error('CSV Export Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const importCsv = async (req, res) => {
  let connection;
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const companyId = req.user.company_id || req.user.companyId;
    
    connection = await pool.getConnection();
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');
    await connection.beginTransaction();

    const zip = new AdmZip(req.file.buffer);
    const zipEntries = zip.getEntries();

    for (const zipEntry of zipEntries) {
      if (zipEntry.name.endsWith('.csv')) {
        const tableName = zipEntry.name.replace('.csv', '');
        const csvContent = zipEntry.getData().toString('utf8');
        
        const records = parse(csvContent, { columns: true, skip_empty_lines: true });
        if (records.length === 0) continue;

        const [columns] = await connection.query(`SHOW COLUMNS FROM \`${tableName}\``);
        const hasCompanyId = columns.some(c => c.Field === 'company_id');

        if (hasCompanyId) {
          await connection.query(`DELETE FROM \`${tableName}\` WHERE company_id = ?`, [companyId]);
        }

        const cols = Object.keys(records[0]);
        const values = records.map(record => Object.values(record).map(val => val === '' ? null : val));
        
        const chunkSize = 100;
        for (let i = 0; i < values.length; i += chunkSize) {
          const chunk = values.slice(i, i + chunkSize);
          await connection.query(`REPLACE INTO \`${tableName}\` (??) VALUES ?`, [cols, chunk]);
        }
      }
    }

    await connection.commit();
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');
    connection.release();

    res.json({ success: true, message: 'CSV Database restored successfully' });
  } catch (error) {
    if (connection) {
      await connection.rollback();
      await connection.query('SET FOREIGN_KEY_CHECKS = 1');
      connection.release();
    }
    console.error('CSV Import Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

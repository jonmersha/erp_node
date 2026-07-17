import pool from '../db.js';
import crypto from 'node:crypto';
import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';

export const getAllRawMaterials = async (req, res) => {
  try {
    const { companyId } = req.query;
    let query = 'SELECT * FROM raw_materials';
    let params = [];
    if (companyId) {
      query += ' WHERE company_id = ?';
      params.push(companyId);
    }
    const [rows] = await pool.query(query, params);
    
    const mappedRows = rows.map(row => ({
      ...row,
      companyId: row.company_id
    }));
    res.json(mappedRows);
  } catch (error) {
    console.error("rawMaterial error:", error);
    res.status(500).json({ error: 'Failed to fetch raw materials', details: error.message });
  }
};

export const createRawMaterial = async (req, res) => {
  try {
    const { id, name, unit, company_id, companyId } = req.body;
    const materialId = id || crypto.randomUUID();
    const finalCompanyId = company_id || companyId;
    await pool.query(
      'INSERT INTO raw_materials (id, name, unit, company_id) VALUES (?, ?, ?, ?)',
      [materialId, name, unit, finalCompanyId]
    );
    res.status(201).json({ id: materialId });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create raw material' });
  }
};

export const updateRawMaterial = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, unit } = req.body;
    await pool.query(
      'UPDATE raw_materials SET name = ?, unit = ? WHERE id = ?',
      [name, unit, id]
    );
    res.json({ message: 'Raw material updated' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update raw material' });
  }
};

export const deleteRawMaterial = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM inventory WHERE item_id = ?', [id]);
    await pool.query('DELETE FROM raw_materials WHERE id = ?', [id]);
    res.json({ message: 'Raw material deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete raw material' });
  }
};

export const downloadTemplate = (req, res) => {
  try {
    const columns = ['Name', 'Unit'];
    const csvData = stringify([columns]);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=raw_materials_template.csv');
    res.status(200).send(csvData);
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate template' });
  }
};

export const uploadRawMaterials = async (req, res) => {
  try {
    const { companyId } = req.body;
    if (!companyId) return res.status(400).json({ error: 'Company ID is required' });
    if (!req.file) return res.status(400).json({ error: 'No CSV file uploaded' });

    const fileContent = req.file.buffer.toString('utf-8');
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });

    if (records.length === 0) {
      return res.status(400).json({ error: 'CSV file is empty' });
    }

    let insertedCount = 0;

    for (const row of records) {
      const name = row['Name'];
      const unit = row['Unit'];

      if (!name || !unit) {
        continue;
      }

      const materialId = crypto.randomUUID();
      await pool.query(
        'INSERT INTO raw_materials (id, name, unit, company_id) VALUES (?, ?, ?, ?)',
        [materialId, name, unit, companyId]
      );
      insertedCount++;
    }

    res.status(200).json({ message: `Successfully uploaded ${insertedCount} raw materials.` });
  } catch (error) {
    console.error('CSV upload error:', error);
    res.status(500).json({ error: 'Failed to process CSV file', details: error.message });
  }
};

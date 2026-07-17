import pool from '../db.js';
import crypto from 'node:crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.join(__dirname, '../../uploads');

const deleteOldFile = (url) => {
  if (url && url.startsWith('/api/uploads/')) {
    const filename = url.split('/').pop();
    const filepath = path.join(uploadDir, filename);
    if (fs.existsSync(filepath)) {
      try { fs.unlinkSync(filepath); } catch (e) { console.error('Failed to delete file:', e); }
    }
  }
};

export const getAllProducts = async (req, res) => {
  try {
    const { companyId } = req.query;
    let query = 'SELECT * FROM products';
    let params = [];
    if (companyId) {
      query += ' WHERE company_id = ?';
      params.push(companyId);
    }
    const [rows] = await pool.query(query, params);
    
    // map snake_case to camelCase
    const mappedRows = rows.map(row => ({
      ...row,
      companyId: row.company_id,
      packageSize: row.package_size,
      imageUrl: row.image_url,
      categoryId: row.category_id
    }));
    res.json(mappedRows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch products' });
  }
};

export const createProduct = async (req, res) => {
  try {
    const { id, name, categoryId, category_id, package_size, packageSize, unit, price, company_id, companyId, image_url, imageUrl } = req.body;
    const productId = id || crypto.randomUUID();
    const finalPackageSize = package_size || packageSize;
    const finalCompanyId = company_id || companyId;
    const finalImageUrl = image_url || imageUrl || null;
    const finalCategoryId = category_id || categoryId;
    await pool.query(
      'INSERT INTO products (id, name, category_id, package_size, unit, price, company_id, image_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [productId, name, finalCategoryId, finalPackageSize, unit, price, finalCompanyId, finalImageUrl]
    );
    res.status(201).json({ id: productId });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create product' });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    
    const [rows] = await pool.query('SELECT image_url FROM products WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Product not found' });
    const oldImageUrl = rows[0].image_url;

    const { name, categoryId, category_id, package_size, packageSize, unit, price, image_url, imageUrl } = req.body;
    const finalPackageSize = package_size || packageSize;
    const finalImageUrl = imageUrl !== undefined ? imageUrl : (image_url || null);
    const finalCategoryId = category_id || categoryId;
    
    if (oldImageUrl && oldImageUrl !== finalImageUrl) {
      deleteOldFile(oldImageUrl);
    }

    await pool.query(
      'UPDATE products SET name = ?, category_id = ?, package_size = ?, unit = ?, price = ?, image_url = ? WHERE id = ?',
      [name, finalCategoryId, finalPackageSize, unit, price, finalImageUrl, id]
    );
    res.json({ message: 'Product updated' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update product' });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query('SELECT image_url FROM products WHERE id = ?', [id]);
    
    await pool.query('DELETE FROM inventory WHERE item_id = ?', [id]);
    await pool.query('DELETE FROM products WHERE id = ?', [id]);
    
    if (rows.length > 0 && rows[0].image_url) {
      deleteOldFile(rows[0].image_url);
    }
    
    res.json({ message: 'Product deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete product' });
  }
};

export const downloadTemplate = (req, res) => {
  try {
    const columns = ['Name', 'Category Name', 'Package Size', 'Unit', 'Price'];
    const csvData = stringify([columns]);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=products_template.csv');
    res.status(200).send(csvData);
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate template' });
  }
};

export const uploadProducts = async (req, res) => {
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

    // Process rows
    let insertedCount = 0;
    
    // Fetch existing categories to resolve by name
    const [categories] = await pool.query('SELECT id, name FROM categories WHERE company_id = ?', [companyId]);
    const categoryMap = {}; // name (lower) -> id
    categories.forEach(c => {
      categoryMap[c.name.toLowerCase()] = c.id;
    });

    for (const row of records) {
      const name = row['Name'];
      const catName = row['Category Name'];
      const packageSize = row['Package Size'];
      const unit = row['Unit'];
      const price = parseFloat(row['Price'] || '0');

      if (!name || !catName || !packageSize || !unit) {
        continue; // Skip invalid rows
      }

      let categoryId = categoryMap[catName.toLowerCase()];
      if (!categoryId) {
        // Auto-create category
        categoryId = crypto.randomUUID();
        await pool.query(
          'INSERT INTO categories (id, name, company_id) VALUES (?, ?, ?)',
          [categoryId, catName, companyId]
        );
        categoryMap[catName.toLowerCase()] = categoryId; // cache it
      }

      const productId = crypto.randomUUID();
      await pool.query(
        'INSERT INTO products (id, name, category_id, package_size, unit, price, company_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [productId, name, categoryId, packageSize, unit, price, companyId]
      );
      insertedCount++;
    }

    res.status(200).json({ message: `Successfully uploaded ${insertedCount} products.` });
  } catch (error) {
    console.error('CSV upload error:', error);
    res.status(500).json({ error: 'Failed to process CSV file', details: error.message });
  }
};

import pool from '../db.js';
import crypto from 'node:crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

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
    
    await pool.query('DELETE FROM products WHERE id = ?', [id]);
    
    if (rows.length > 0 && rows[0].image_url) {
      deleteOldFile(rows[0].image_url);
    }
    
    res.json({ message: 'Product deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete product' });
  }
};

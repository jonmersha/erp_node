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

export const getAllCompanies = async (req, res) => {
  try {
    let query = 'SELECT * FROM companies';
    const [rows] = await pool.query(query);
    
    const mappedRows = rows.map(row => ({
      ...row,
      logoUrl: row.logo_url,
      bannerUrl: row.banner_url,
      ownerId: row.owner_id,
      createdAt: row.created_at
    }));
    res.json(mappedRows);
  } catch (error) {
    console.error('Fetch companies error:', error);
    res.status(500).json({ error: 'Failed to fetch companies', details: error.message });
  }
};

export const createCompany = async (req, res) => {
  try {
    const { id, name, address, phone, email, logo_url, banner_url, owner_id, logoUrl, bannerUrl, ownerId } = req.body;
    const companyId = id || crypto.randomUUID();
    
    const finalLogoUrl = logo_url || logoUrl || null;
    const finalBannerUrl = banner_url || bannerUrl || null;
    const finalOwnerId = owner_id || ownerId || null;

    await pool.query(
      'INSERT INTO companies (id, name, address, phone, email, logo_url, banner_url, owner_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [companyId, name, address, phone, email, finalLogoUrl, finalBannerUrl, finalOwnerId]
    );
    res.status(201).json({ id: companyId });
  } catch (error) {
    console.error('Create company error:', error);
    res.status(500).json({ error: 'Failed to create company', details: error.message });
  }
};

export const getCompany = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query('SELECT * FROM companies WHERE id = ?', [id]);
    if (rows.length > 0) {
      const row = rows[0];
      res.json({
        ...row,
        logoUrl: row.logo_url,
        bannerUrl: row.banner_url,
        ownerId: row.owner_id,
        createdAt: row.created_at
      });
    } else {
      res.json(null);
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch company' });
  }
};

export const updateCompany = async (req, res) => {
  try {
    const { id } = req.params;
    
    const [rows] = await pool.query('SELECT logo_url, banner_url FROM companies WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Company not found' });
    const oldCompany = rows[0];

    const { name, address, phone, email, logo_url, banner_url, owner_id, logoUrl, bannerUrl, ownerId } = req.body;
    
    // Prefer camelCase if provided, otherwise fallback to snake_case
    const finalLogoUrl = logoUrl !== undefined ? logoUrl : (logo_url || null);
    const finalBannerUrl = bannerUrl !== undefined ? bannerUrl : (banner_url || null);
    const finalOwnerId = ownerId !== undefined ? ownerId : (owner_id || null);

    if (finalLogoUrl && finalLogoUrl !== oldCompany.logo_url) deleteOldFile(oldCompany.logo_url);
    if (finalBannerUrl && finalBannerUrl !== oldCompany.banner_url) deleteOldFile(oldCompany.banner_url);

    await pool.query(
      'UPDATE companies SET name = ?, address = ?, phone = ?, email = ?, logo_url = ?, banner_url = ?, owner_id = ? WHERE id = ?',
      [name, address, phone, email, finalLogoUrl, finalBannerUrl, finalOwnerId, id]
    );
    res.json({ message: 'Company updated' });
  } catch (error) {
    console.error('Update company error:', error);
    res.status(500).json({ error: 'Failed to update company' });
  }
};

export const deleteCompany = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query('SELECT logo_url, banner_url FROM companies WHERE id = ?', [id]);
    
    await pool.query('DELETE FROM companies WHERE id = ?', [id]);
    
    if (rows.length > 0) {
      if (rows[0].logo_url) deleteOldFile(rows[0].logo_url);
      if (rows[0].banner_url) deleteOldFile(rows[0].banner_url);
    }
    
    res.json({ message: 'Company deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete company' });
  }
};

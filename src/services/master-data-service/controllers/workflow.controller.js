import pool from '../../../db.js';
import crypto from 'node:crypto';

export const getWorkflowTemplates = async (req, res) => {
  try {
    const { companyId } = req.query;
    if (!companyId) return res.status(400).json({ error: 'companyId is required' });

    const [templates] = await pool.query('SELECT * FROM workflow_templates WHERE company_id = ? ORDER BY created_at DESC', [companyId]);
    
    if (templates.length === 0) return res.json([]);

    const templateIds = templates.map(t => t.id);
    const [stages] = await pool.query('SELECT * FROM workflow_template_stages WHERE template_id IN (?) ORDER BY stage_order ASC', [templateIds]);
    
    // map snake_case to camelCase
    const mappedTemplates = templates.map(t => {
      const tStages = stages.filter(s => s.template_id === t.id).map(s => ({
        id: s.id,
        templateId: s.template_id,
        stageName: s.stage_name,
        stageOrder: s.stage_order,
        estimatedTimeMinutes: s.estimated_time_minutes,
        percentageWeight: s.percentage_weight,
        companyId: s.company_id
      }));

      return {
        id: t.id,
        name: t.name,
        description: t.description,
        companyId: t.company_id,
        createdAt: t.created_at,
        stages: tStages
      };
    });
    
    res.json(mappedTemplates);
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({ error: 'Failed to fetch workflow templates' });
  }
};

export const getWorkflowTemplateWithStages = async (req, res) => {
  try {
    const { id } = req.params;
    const [templates] = await pool.query('SELECT * FROM workflow_templates WHERE id = ?', [id]);
    if (templates.length === 0) return res.status(404).json({ error: 'Template not found' });
    
    const [stages] = await pool.query('SELECT * FROM workflow_template_stages WHERE template_id = ? ORDER BY stage_order ASC', [id]);
    
    const mappedTemplate = {
      id: templates[0].id,
      name: templates[0].name,
      description: templates[0].description,
      companyId: templates[0].company_id,
      createdAt: templates[0].created_at,
      stages: stages.map(s => ({
        id: s.id,
        templateId: s.template_id,
        stageName: s.stage_name,
        stageOrder: s.stage_order,
        estimatedTimeMinutes: s.estimated_time_minutes,
        percentageWeight: s.percentage_weight,
        companyId: s.company_id
      }))
    };
    
    res.json(mappedTemplate);
  } catch (error) {
    console.error('Error fetching template:', error);
    res.status(500).json({ error: 'Failed to fetch workflow template' });
  }
};

export const createWorkflowTemplate = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const { name, description, companyId, stages } = req.body;
    
    if (!name || !companyId) {
      throw new Error('Name and companyId are required');
    }

    const templateId = crypto.randomUUID();

    await connection.query(
      'INSERT INTO workflow_templates (id, name, description, company_id) VALUES (?, ?, ?, ?)',
      [templateId, name, description || null, companyId]
    );

    if (stages && Array.isArray(stages)) {
      for (let i = 0; i < stages.length; i++) {
        const stage = stages[i];
        const stageId = crypto.randomUUID();
        await connection.query(
          `INSERT INTO workflow_template_stages 
            (id, template_id, stage_name, stage_order, estimated_time_minutes, percentage_weight, company_id) 
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            stageId,
            templateId,
            stage.stageName,
            stage.stageOrder || (i + 1),
            stage.estimatedTimeMinutes || null,
            stage.percentageWeight || null,
            companyId
          ]
        );
      }
    }

    await connection.commit();
    res.status(201).json({ id: templateId });
  } catch (error) {
    await connection.rollback();
    console.error('Error creating template:', error);
    res.status(500).json({ error: 'Failed to create workflow template', details: error.message });
  } finally {
    connection.release();
  }
};

export const updateWorkflowTemplate = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const { id } = req.params;
    const { name, description, stages } = req.body;

    const [existing] = await connection.query('SELECT * FROM workflow_templates WHERE id = ?', [id]);
    if (existing.length === 0) throw new Error('Template not found');
    const template = existing[0];

    await connection.query(
      'UPDATE workflow_templates SET name = ?, description = ? WHERE id = ?',
      [name || template.name, description !== undefined ? description : template.description, id]
    );

    if (stages && Array.isArray(stages)) {
      // For simplicity, delete existing stages and insert new ones
      await connection.query('DELETE FROM workflow_template_stages WHERE template_id = ?', [id]);
      
      for (let i = 0; i < stages.length; i++) {
        const stage = stages[i];
        const stageId = crypto.randomUUID();
        await connection.query(
          `INSERT INTO workflow_template_stages 
            (id, template_id, stage_name, stage_order, estimated_time_minutes, percentage_weight, company_id) 
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            stageId,
            id,
            stage.stageName,
            stage.stageOrder || (i + 1),
            stage.estimatedTimeMinutes || null,
            stage.percentageWeight || null,
            template.company_id
          ]
        );
      }
    }

    await connection.commit();
    res.json({ success: true });
  } catch (error) {
    await connection.rollback();
    console.error('Error updating template:', error);
    res.status(500).json({ error: 'Failed to update workflow template', details: error.message });
  } finally {
    connection.release();
  }
};

export const deleteWorkflowTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM workflow_templates WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting template:', error);
    res.status(500).json({ error: 'Failed to delete workflow template' });
  }
};

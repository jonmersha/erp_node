import { v4 as uuidv4 } from 'uuid';
import pool from './src/db.js';

const COMPANY_ID = '39eeefea-8f69-4d55-8f97-e10f130ca68d';

async function seed() {
  try {
    const templateId = uuidv4();
    
    console.log('Inserting Workflow Template...');
    await pool.query(
      `INSERT INTO workflow_templates (id, name, description, company_id) VALUES (?, ?, ?, ?)`,
      [templateId, 'Standard Wheat Milling', 'End-to-end standard process for converting raw wheat to finished flour bags.', COMPANY_ID]
    );

    const stages = [
      {
        name: 'Phase 1: Grain Intake & Storage (Receiving)',
        time: 120,
        weight: 10
      },
      {
        name: 'Phase 2: Cleaning & Conditioning (Tempering)',
        time: 360,
        weight: 20
      },
      {
        name: 'Phase 3: Milling Run',
        time: 480,
        weight: 50
      },
      {
        name: 'Phase 4: Packaging & Dispatch',
        time: 240,
        weight: 20
      }
    ];

    console.log('Inserting Workflow Template Stages...');
    for (let i = 0; i < stages.length; i++) {
      const stage = stages[i];
      await pool.query(
        `INSERT INTO workflow_template_stages (id, template_id, stage_name, stage_order, estimated_time_minutes, percentage_weight, company_id)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [uuidv4(), templateId, stage.name, i + 1, stage.time, stage.weight, COMPANY_ID]
      );
    }

    console.log('Successfully seeded workflow templates.');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
}

seed();

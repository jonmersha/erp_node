import { v4 as uuidv4 } from 'uuid';
import pool from './src/db.js';

const COMPANY_ID = '39eeefea-8f69-4d55-8f97-e10f130ca68d';

const templates = [
  {
    name: 'Pasta & Macaroni Production',
    description: 'Standard workflow for manufacturing pasta products via extrusion and drying.',
    stages: [
      { name: 'Raw Material Mixing (Flour & Water)', time: 60, weight: 15 },
      { name: 'Extrusion & Shaping', time: 120, weight: 25 },
      { name: 'Drying & Moisture Control', time: 300, weight: 40 },
      { name: 'Cooling, Inspection & Packaging', time: 120, weight: 20 }
    ]
  },
  {
    name: 'Biscuit & Cookie Production',
    description: 'Standard workflow for mixing, baking, and packaging biscuits.',
    stages: [
      { name: 'Ingredient Dosing & Dough Mixing', time: 90, weight: 15 },
      { name: 'Moulding / Forming', time: 60, weight: 20 },
      { name: 'Oven Baking', time: 180, weight: 40 },
      { name: 'Cooling, Sorting & Quality Check', time: 60, weight: 10 },
      { name: 'Packaging & Box Assembly', time: 90, weight: 15 }
    ]
  },
  {
    name: 'Commercial Bakery / Bread Production',
    description: 'High-volume workflow for standard bread baking.',
    stages: [
      { name: 'Dough Mixing & Kneading', time: 60, weight: 15 },
      { name: 'Fermentation & Proofing', time: 180, weight: 30 },
      { name: 'Dividing & Shaping', time: 60, weight: 15 },
      { name: 'Baking', time: 90, weight: 30 },
      { name: 'Cooling & Slicing/Packaging', time: 60, weight: 10 }
    ]
  }
];

async function seed() {
  try {
    console.log('Seeding additional Food Complex Workflow Templates...');

    for (const t of templates) {
      const templateId = uuidv4();
      await pool.query(
        `INSERT INTO workflow_templates (id, name, description, company_id) VALUES (?, ?, ?, ?)`,
        [templateId, t.name, t.description, COMPANY_ID]
      );
      
      console.log(`Inserted Template: ${t.name}`);

      for (let i = 0; i < t.stages.length; i++) {
        const stage = t.stages[i];
        await pool.query(
          `INSERT INTO workflow_template_stages (id, template_id, stage_name, stage_order, estimated_time_minutes, percentage_weight, company_id)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [uuidv4(), templateId, stage.name, i + 1, stage.time, stage.weight, COMPANY_ID]
        );
      }
    }

    console.log('Successfully seeded additional workflow templates.');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
}

seed();

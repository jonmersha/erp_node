import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
dotenv.config();

const orgData = {
  name: 'President',
  role: 'President / CEO',
  employees: ['Executive Assistant', 'Strategic Advisor'],
  children: [
    {
      name: 'Production Department',
      role: 'Production Director',
      employees: ['Production Planner', 'Shift Coordinator'],
      children: [
        {
          name: 'Processing Unit',
          role: 'Processing Manager',
          employees: ['Machine Operator', 'Mixer', 'Cook'],
          children: []
        },
        {
          name: 'Packaging Unit',
          role: 'Packaging Supervisor',
          employees: ['Bottler', 'Sealer', 'Boxer'],
          children: []
        }
      ]
    },
    {
      name: 'Quality & Food Safety Department',
      role: 'Quality Assurance Director',
      employees: ['QA Compliance Officer', 'Document Controller'],
      children: [
        {
          name: 'Laboratory Unit',
          role: 'Lab Manager',
          employees: ['Food Chemist', 'Microbiologist'],
          children: []
        },
        {
          name: 'Sanitation Unit',
          role: 'Hygiene Supervisor',
          employees: ['Cleaning Crew', 'Sanitation Technician'],
          children: []
        }
      ]
    },
    {
      name: 'Supply Chain Department',
      role: 'Supply Chain Director',
      employees: ['Logistics Analyst', 'Supply Coordinator'],
      children: [
        {
          name: 'Procurement Unit',
          role: 'Purchasing Manager',
          employees: ['Ingredient Buyer', 'Vendor Negotiator'],
          children: []
        },
        {
          name: 'Warehouse Unit',
          role: 'Warehouse Manager',
          employees: ['Forklift Operator', 'Inventory Clerk'],
          children: []
        }
      ]
    },
    {
      name: 'Engineering & Maintenance Department',
      role: 'Chief Engineer',
      employees: ['Maintenance Planner', 'Safety Officer'],
      children: [
        {
          name: 'Mechanical Unit',
          role: 'Mechanical Supervisor',
          employees: ['Machine Mechanic', 'Welder'],
          children: []
        },
        {
          name: 'Electrical Unit',
          role: 'Electrical Supervisor',
          employees: ['Electrician', 'PLC Technician'],
          children: []
        }
      ]
    }
  ]
};

async function seed() {
  const connection = await mysql.createConnection({
    host: process.env.MYSQL_HOST || 'localhost',
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || 'password',
    database: process.env.MYSQL_DATABASE || 'erp_db',
    port: process.env.MYSQL_PORT || 3306
  });

  console.log('Connected to DB');
  
  // Disable FK checks and truncate tables
  await connection.query('SET FOREIGN_KEY_CHECKS = 0');
  await connection.query('TRUNCATE TABLE departments');
  await connection.query('TRUNCATE TABLE employees');
  await connection.query('SET FOREIGN_KEY_CHECKS = 1');

  console.log('Cleared departments and employees.');

  // Default company and factory for the seed
  const companyId = '39eeefea-8f69-4d55-8f97-e10f130ca68d';
  const [[factory]] = await connection.query('SELECT id FROM factories LIMIT 1');
  const factoryId = factory ? factory.id : null;

  async function processNode(node, parentDeptId = null, parentManagerId = null) {
    // 1. Create Department
    const [deptResult] = await connection.query(
      `INSERT INTO departments (id, name, description, parent_department_id, company_id) VALUES (UUID(), ?, ?, ?, ?)`,
      [node.name, node.name, parentDeptId, companyId]
    );
    
    // Get the generated dept ID
    const [[dept]] = await connection.query('SELECT id FROM departments WHERE name = ? ORDER BY created_at DESC LIMIT 1', [node.name]);
    const deptId = dept.id;

    // 2. Create the Manager
    const [managerResult] = await connection.query(
      `INSERT INTO employees (id, name, email, role, department_id, manager_id, factory_id, company_id, salary) 
       VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        node.role, // Name them by their role for clarity
        `${node.role.toLowerCase().replace(/[^a-z]/g, '')}@factory.com`,
        node.role,
        deptId,
        parentManagerId, // Report to the parent manager
        factoryId,
        companyId,
        8000 // default salary
      ]
    );

    // Get Manager ID
    const [[manager]] = await connection.query('SELECT id FROM employees WHERE email = ? LIMIT 1', [`${node.role.toLowerCase().replace(/[^a-z]/g, '')}@factory.com`]);
    const managerId = manager.id;

    // Update department to set its manager
    await connection.query(`UPDATE departments SET manager_id = ? WHERE id = ?`, [managerId, deptId]);

    // 3. Create regular employees
    for (const empRole of node.employees) {
      await connection.query(
        `INSERT INTO employees (id, name, email, role, department_id, manager_id, factory_id, company_id, salary) 
         VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          empRole,
          `${empRole.toLowerCase().replace(/[^a-z]/g, '')}@factory.com`,
          empRole,
          deptId,
          managerId, // Regular employees report to the department manager
          factoryId,
          companyId,
          4000
        ]
      );
    }

    // 4. Process children recursively
    for (const child of node.children) {
      await processNode(child, deptId, managerId);
    }
  }

  await processNode(orgData);
  
  console.log('Seeding complete!');
  await connection.end();
}

seed().catch(console.error);

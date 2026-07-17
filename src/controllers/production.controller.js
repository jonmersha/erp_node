import pool from '../db.js';
import crypto from 'node:crypto';
import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';

const deductMaterialsForRun = async (connection, runId, recipeId, quantityPlanned, companyId, userId) => {
  if (!recipeId) return;
  
  // Check if already deducted
  const [existingTx] = await connection.query(
    "SELECT id FROM inventory_transactions WHERE reference_id = ? AND reference_type = 'production_run_start'",
    [runId]
  );
  if (existingTx.length > 0) return; // Already deducted

  // Get Recipe BOM
  const [recipeRows] = await connection.query('SELECT bom FROM recipes WHERE id = ?', [recipeId]);
  if (recipeRows.length === 0) return;
  const recipe = recipeRows[0];
  let bom = [];
  try {
    bom = typeof recipe.bom === 'string' ? JSON.parse(recipe.bom) : recipe.bom;
  } catch(e) {}
  
  if (!Array.isArray(bom) || bom.length === 0) return;

  // Deduct each item
  for (const item of bom) {
    const requiredQty = (parseFloat(item.quantity) || 0) * (parseFloat(quantityPlanned) || 0);
    if (requiredQty <= 0) continue;

    const [invRows] = await connection.query(
      "SELECT * FROM inventory WHERE item_id = ? AND company_id = ? ORDER BY quantity DESC",
      [item.itemId, companyId]
    );

    let remainingToDeduct = requiredQty;
    for (const inv of invRows) {
      if (remainingToDeduct <= 0) break;
      const deductAmt = Math.min(inv.quantity, remainingToDeduct);
      
      await connection.query("UPDATE inventory SET quantity = quantity - ? WHERE id = ?", [deductAmt, inv.id]);
      
      const txId = crypto.randomUUID();
      await connection.query(
        "INSERT INTO inventory_transactions (id, inventory_id, item_id, transaction_type, quantity, reference_id, reference_type, notes, user_id, company_id) VALUES (?, ?, ?, 'out', ?, ?, 'production_run_start', 'Raw materials consumed for production run', ?, ?)",
        [txId, inv.id, item.itemId, deductAmt, runId, userId || null, companyId]
      );
      
      remainingToDeduct -= deductAmt;
    }
    
    if (remainingToDeduct > 0) {
      throw new Error(`Insufficient stock for item ${item.itemId}. Missing ${remainingToDeduct}`);
    }
  }
};

export const getAllProductionRuns = async (req, res) => {
  try {
    const { companyId } = req.query;
    let query = 'SELECT * FROM production_runs';
    let params = [];
    if (companyId) {
      query += ' WHERE company_id = ?';
      params.push(companyId);
    }
    const [rows] = await pool.query(query, params);
    
    let stagesRows = [];
    if (companyId) {
      [stagesRows] = await pool.query('SELECT run_id, percentage_weight, quantity_produced, status FROM production_run_stages WHERE company_id = ?', [companyId]);
    } else {
      [stagesRows] = await pool.query('SELECT run_id, percentage_weight, quantity_produced, status FROM production_run_stages');
    }

    const stagesByRun = stagesRows.reduce((acc, stage) => {
      if (!acc[stage.run_id]) acc[stage.run_id] = [];
      acc[stage.run_id].push(stage);
      return acc;
    }, {});

    // map snake_case to camelCase
    const mappedRows = rows.map(row => {
      const quantityPlanned = typeof row.quantity_planned === 'string' ? parseFloat(row.quantity_planned) : row.quantity_planned;
      const quantityProduced = typeof row.quantity_produced === 'string' ? parseFloat(row.quantity_produced) : row.quantity_produced;
      const runStages = stagesByRun[row.id] || [];
      
      let calculatedProgress = 0;
      let currentStageName = null;
      if (runStages.length > 0) {
        calculatedProgress = runStages.reduce((sum, stage) => {
          if (stage.status === 'completed' && stage.quantity_produced !== null && stage.percentage_weight !== null) {
            const weight = parseFloat(stage.percentage_weight) || 0;
            const units = parseFloat(stage.quantity_produced) || 0;
            return sum + (weight * (units / quantityPlanned));
          }
          return sum;
        }, 0);
        const activeStage = runStages.find(s => s.status !== 'completed');
        currentStageName = activeStage ? activeStage.stage_name : 'All Stages Completed';
      } else {
        calculatedProgress = quantityPlanned > 0 ? (quantityProduced / quantityPlanned) * 100 : 0;
      }

      return {
        ...row,
        companyId: row.company_id,
        factoryId: row.factory_id,
        productId: row.product_id,
        recipeId: row.recipe_id,
        quantityPlanned: quantityPlanned,
        quantityProduced: quantityProduced,
        quantity: quantityPlanned,
        calculatedProgress: Math.min(calculatedProgress, 100),
        currentStageName: currentStageName,
        workflowTemplateId: row.workflow_template_id,
        startDate: row.start_date,
        createdAt: row.created_at
      };
    });
    res.json(mappedRows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch production runs' });
  }
};

export const createProductionRun = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const { 
      id, 
      factoryId, factory_id, 
      productId, product_id, 
      recipeId, recipe_id, 
      quantityPlanned, quantity_planned, quantity, 
      quantityProduced, quantity_produced, 
      status, 
      startDate, start_date, 
      companyId, company_id,
      workflowTemplateId,
      stages // optional legacy array
    } = req.body;
    
    const runId = id || crypto.randomUUID();
    const finalStartDate = startDate || start_date;
    const formattedStartDate = finalStartDate ? new Date(finalStartDate).toISOString().slice(0, 19).replace('T', ' ') : null;
    const finalQuantityPlanned = quantityPlanned || quantity_planned || quantity || 0;
    const finalCompanyId = companyId || company_id;

    await connection.query(
      'INSERT INTO production_runs (id, factory_id, product_id, recipe_id, quantity_planned, quantity_produced, status, start_date, workflow_template_id, company_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        runId, 
        factoryId || factory_id || null, 
        productId || product_id || null, 
        recipeId || recipe_id || null, 
        finalQuantityPlanned, 
        quantityProduced || quantity_produced || 0, 
        status === 'planned' ? 'scheduled' : status, 
        formattedStartDate, 
        workflowTemplateId || null,
        finalCompanyId
      ]
    );

    let stagesToInsert = stages || [];

    // If workflowTemplateId is provided, fetch its stages and use them
    if (workflowTemplateId) {
      const [templateStages] = await connection.query(
        'SELECT * FROM workflow_template_stages WHERE template_id = ? ORDER BY stage_order ASC', 
        [workflowTemplateId]
      );
      if (templateStages.length > 0) {
        stagesToInsert = templateStages.map(ts => ({
          stageName: ts.stage_name,
          stageOrder: ts.stage_order,
          estimatedTimeMinutes: ts.estimated_time_minutes,
          percentageWeight: ts.percentage_weight,
          assignedOperatorId: null, // operators assigned at run time or ad-hoc
          status: 'pending'
        }));
      }
    }

    if (stagesToInsert && Array.isArray(stagesToInsert)) {
      for (let i = 0; i < stagesToInsert.length; i++) {
        const stage = stagesToInsert[i];
        const stageId = crypto.randomUUID();
        await connection.query(
          `INSERT INTO production_run_stages 
            (id, run_id, stage_name, stage_order, estimated_time_minutes, percentage_weight, assigned_operator_id, status, company_id) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            stageId,
            runId,
            stage.stageName,
            stage.stageOrder || (i + 1),
            stage.estimatedTimeMinutes || null,
            stage.percentageWeight || null,
            stage.assignedOperatorId || null,
            stage.status || 'pending',
            finalCompanyId
          ]
        );
      }
    }

    if (status === 'in_progress') {
      await deductMaterialsForRun(connection, runId, recipeId || recipe_id, finalQuantityPlanned, finalCompanyId, req.user?.uid || null);
    }

    await connection.commit();
    res.status(201).json({ id: runId });
  } catch (error) {
    await connection.rollback();
    console.error('Error creating production run:', error);
    res.status(500).json({ error: 'Failed to create production run', details: error.message });
  } finally {
    connection.release();
  }
};

export const updateProductionRun = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const { id } = req.params;
    const { 
      factoryId, factory_id, 
      productId, product_id, 
      recipeId, recipe_id, 
      quantityPlanned, quantity_planned, 
      quantityProduced, quantity_produced, 
      status, 
      startDate, start_date 
    } = req.body;
    
    // First, fetch the existing record to handle partial updates
    const [existing] = await connection.query('SELECT * FROM production_runs WHERE id = ?', [id]);
    if (existing.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Production run not found' });
    }
    const current = existing[0];
    
    const finalStartDate = startDate || start_date || current.start_date;
    const formattedStartDate = finalStartDate ? new Date(finalStartDate).toISOString().slice(0, 19).replace('T', ' ') : null;
    
    const newStatus = status === 'planned' ? 'scheduled' : (status || current.status);
    const finalRecipeId = recipeId || recipe_id || current.recipe_id;
    const finalQuantityPlanned = quantityPlanned !== undefined ? quantityPlanned : (quantity_planned !== undefined ? quantity_planned : current.quantity_planned);

    await connection.query(
      'UPDATE production_runs SET factory_id = ?, product_id = ?, recipe_id = ?, quantity_planned = ?, quantity_produced = ?, status = ?, start_date = ? WHERE id = ?',
      [
        factoryId || factory_id || current.factory_id, 
        productId || product_id || current.product_id, 
        finalRecipeId, 
        finalQuantityPlanned, 
        quantityProduced !== undefined ? quantityProduced : (quantity_produced !== undefined ? quantity_produced : current.quantity_produced), 
        newStatus, 
        formattedStartDate, 
        id
      ]
    );

    if ((current.status === 'scheduled' || current.status === 'planned') && newStatus === 'in_progress') {
      await deductMaterialsForRun(connection, id, finalRecipeId, finalQuantityPlanned, current.company_id, req.user?.uid || null);
    }

    await connection.commit();
    res.json({ message: 'Production run updated' });
  } catch (error) {
    await connection.rollback();
    console.error('Error updating production run:', error);
    res.status(500).json({ error: 'Failed to update production run', details: error.message });
  } finally {
    connection.release();
  }
};

export const deleteProductionRun = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM production_runs WHERE id = ?', [id]);
    res.json({ message: 'Production run deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete production run' });
  }
};

export const downloadTemplate = (req, res) => {
  try {
    const columns = ['Factory Name', 'Product Name', 'Planned Quantity', 'Status'];
    const csvData = stringify([columns]);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=production_runs_template.csv');
    res.status(200).send(csvData);
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate template' });
  }
};

export const uploadProductionRuns = async (req, res) => {
  try {
    const companyId = req.user?.company_id || req.body.companyId;
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

    // Fetch factories
    const [factories] = await pool.query('SELECT id, name FROM factories WHERE company_id = ?', [companyId]);
    const factoryMap = {}; 
    factories.forEach(f => {
      factoryMap[f.name.toLowerCase()] = f.id;
    });

    // Fetch products
    const [products] = await pool.query('SELECT id, name FROM products WHERE company_id = ?', [companyId]);
    const productMap = {};
    products.forEach(p => {
      productMap[p.name.toLowerCase()] = p.id;
    });

    for (const row of records) {
      const factName = row['Factory Name'];
      const prodName = row['Product Name'];
      const qty = parseFloat(row['Planned Quantity']);
      let status = row['Status'] ? row['Status'].toLowerCase() : 'scheduled';
      
      if (!['scheduled', 'in_progress', 'completed', 'cancelled'].includes(status)) {
        status = 'scheduled';
      }

      if (!factName || !prodName || isNaN(qty) || qty <= 0) {
        continue;
      }

      // We won't auto-create factories/products here as they are complex entities. 
      // Just skip if they don't exist.
      const factoryId = factoryMap[factName.toLowerCase()];
      const productId = productMap[prodName.toLowerCase()];

      if (!factoryId || !productId) {
        continue;
      }

      const id = crypto.randomUUID();
      await pool.query(
        'INSERT INTO production_runs (id, factory_id, product_id, quantity_planned, status, company_id) VALUES (?, ?, ?, ?, ?, ?)',
        [id, factoryId, productId, qty, status, companyId]
      );
      insertedCount++;
    }

    res.status(200).json({ message: `Successfully uploaded ${insertedCount} production runs.` });
  } catch (error) {
    console.error('CSV upload error:', error);
    res.status(500).json({ error: 'Failed to process CSV file', details: error.message });
  }
};

export const getProductionEvents = async (req, res) => {
  try {
    const { id } = req.params;
    const [events] = await pool.query('SELECT * FROM production_events WHERE run_id = ? ORDER BY created_at ASC', [id]);
    
    // map snake_case to camelCase
    const mappedEvents = events.map(event => ({
      ...event,
      runId: event.run_id,
      eventType: event.event_type,
      performedBy: event.performed_by,
      companyId: event.company_id,
      createdAt: event.created_at,
      payload: typeof event.payload === 'string' ? JSON.parse(event.payload) : event.payload
    }));
    res.json(mappedEvents);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch production events' });
  }
};

export const getProductionStages = async (req, res) => {
  try {
    const { id } = req.params;
    const [stages] = await pool.query('SELECT * FROM production_run_stages WHERE run_id = ? ORDER BY stage_order ASC', [id]);
    
    const mappedStages = stages.map(stage => ({
      id: stage.id,
      runId: stage.run_id,
      stageName: stage.stage_name,
      stageOrder: stage.stage_order,
      estimatedTimeMinutes: stage.estimated_time_minutes,
      percentageWeight: stage.percentage_weight,
      assignedOperatorId: stage.assigned_operator_id,
      status: stage.status,
      actualTimeMinutes: stage.actual_time_minutes,
      quantityProduced: stage.quantity_produced ? parseFloat(stage.quantity_produced) : undefined,
      notes: stage.notes,
      companyId: stage.company_id,
      createdAt: stage.created_at
    }));
    res.json(mappedStages);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch production stages' });
  }
};

export const updateProductionStage = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const { id, stageId } = req.params;
    const { status, actualTimeMinutes, quantityProduced, notes, performedBy } = req.body;

    const [stageRows] = await connection.query('SELECT * FROM production_run_stages WHERE id = ? AND run_id = ?', [stageId, id]);
    if (stageRows.length === 0) {
      throw new Error('Stage not found');
    }
    const stage = stageRows[0];

    await connection.query(
      'UPDATE production_run_stages SET status = ?, actual_time_minutes = ?, quantity_produced = ?, notes = ? WHERE id = ?',
      [
        status || stage.status,
        actualTimeMinutes !== undefined ? actualTimeMinutes : stage.actual_time_minutes,
        quantityProduced !== undefined ? quantityProduced : stage.quantity_produced,
        notes !== undefined ? notes : stage.notes,
        stageId
      ]
    );

    // Also log this as an event in production_events for auditing
    const eventId = crypto.randomUUID();
    const payloadStr = JSON.stringify({ actualTimeMinutes, quantityProduced, notes, action: 'stage_update' });
    await connection.query(
      'INSERT INTO production_events (id, run_id, event_type, payload, notes, performed_by, company_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [eventId, id, stage.stage_name, payloadStr, notes || null, performedBy || null, stage.company_id]
    );

    await connection.commit();
    res.status(200).json({ success: true });
  } catch (error) {
    await connection.rollback();
    console.error('Error updating stage:', error);
    res.status(500).json({ error: 'Failed to update stage', details: error.message });
  } finally {
    connection.release();
  }
};

export const logProductionEvent = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const { id } = req.params; // run_id
    const { eventType, notes, performedBy, payload } = req.body;
    
    // 1. Fetch Production Run
    const [runRows] = await connection.query('SELECT * FROM production_runs WHERE id = ?', [id]);
    if (runRows.length === 0) {
      throw new Error('Production run not found');
    }
    const run = runRows[0];

    // 2. Insert Event
    const eventId = crypto.randomUUID();
    const payloadStr = payload ? JSON.stringify(payload) : null;
    
    await connection.query(
      'INSERT INTO production_events (id, run_id, event_type, payload, notes, performed_by, company_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [eventId, id, eventType, payloadStr, notes || null, performedBy || null, run.company_id]
    );

    // 3. Phase-specific Business Logic
    let newStatus = run.status;
    
    if (eventType === 'grain_intake') {
      newStatus = 'in_progress';
      await connection.query('UPDATE production_runs SET status = ? WHERE id = ?', [newStatus, id]);
    } else if (eventType === 'conditioning') {
      newStatus = 'in_progress';
      await connection.query('UPDATE production_runs SET status = ? WHERE id = ?', [newStatus, id]);
    } else if (eventType === 'milling') {
      newStatus = 'in_progress';
      await connection.query('UPDATE production_runs SET status = ? WHERE id = ?', [newStatus, id]);
    } else if (eventType === 'blending') {
      newStatus = 'in_progress';
      await connection.query('UPDATE production_runs SET status = ? WHERE id = ?', [newStatus, id]);
      
      // Deduct Additives
      if (payload && payload.additives && Array.isArray(payload.additives)) {
        for (const additive of payload.additives) {
          const { itemId, quantity, warehouseId } = additive;
          if (itemId && quantity && warehouseId) {
            const [inv] = await connection.query(
              "SELECT * FROM inventory WHERE unit_id = ? AND item_id = ?",
              [warehouseId, itemId]
            );
            if (inv.length > 0 && inv[0].quantity >= quantity) {
              const invId = inv[0].id;
              await connection.query("UPDATE inventory SET quantity = quantity - ? WHERE id = ?", [quantity, invId]);
              const txId = crypto.randomUUID();
              await connection.query(
                "INSERT INTO inventory_transactions (id, inventory_id, item_id, transaction_type, quantity, reference_id, reference_type, notes, user_id, company_id) VALUES (?, ?, ?, 'out', ?, ?, 'production_run', 'Blending additive consumed', ?, ?)",
                [txId, invId, itemId, quantity, id, performedBy, run.company_id]
              );
            } else {
              throw new Error(`Insufficient additive: ${itemId} in warehouse ${warehouseId}`);
            }
          }
        }
      }
    } else if (eventType === 'packaging') {
      newStatus = 'completed';
      
      // Add Finished Goods and Deduct Empty Sacks
      if (payload && payload.warehouseId) {
        const warehouseId = payload.warehouseId;
        
        // Add Finished Product
        if (payload.sacksProduced && payload.sacksProduced > 0) {
          const [inv] = await connection.query(
            "SELECT * FROM inventory WHERE unit_id = ? AND item_id = ? AND item_type = 'product'",
            [warehouseId, run.product_id]
          );
          
          let invId;
          if (inv.length > 0) {
            invId = inv[0].id;
            await connection.query("UPDATE inventory SET quantity = quantity + ? WHERE id = ?", [payload.sacksProduced, invId]);
          } else {
            invId = crypto.randomUUID();
            await connection.query(
              "INSERT INTO inventory (id, unit_id, item_id, item_type, quantity, company_id) VALUES (?, ?, ?, 'product', ?, ?)",
              [invId, warehouseId, run.product_id, payload.sacksProduced, run.company_id]
            );
          }
          const txId = crypto.randomUUID();
          await connection.query(
            "INSERT INTO inventory_transactions (id, inventory_id, item_id, item_type, transaction_type, quantity, reference_id, reference_type, notes, user_id, company_id) VALUES (?, ?, ?, 'product', 'in', ?, ?, 'production_run', 'Finished goods packaged', ?, ?)",
            [txId, invId, run.product_id, payload.sacksProduced, id, performedBy, run.company_id]
          );
          
          // Update run's produced quantity
          await connection.query('UPDATE production_runs SET quantity_produced = ? WHERE id = ?', [payload.sacksProduced, id]);
        }
        
        // Deduct Empty Sacks
        if (payload.sacksConsumed && payload.sacksConsumed > 0 && payload.sackItemId) {
          const [invSack] = await connection.query(
            "SELECT * FROM inventory WHERE unit_id = ? AND item_id = ?",
            [warehouseId, payload.sackItemId]
          );
          if (invSack.length > 0 && invSack[0].quantity >= payload.sacksConsumed) {
            const invId = invSack[0].id;
            await connection.query("UPDATE inventory SET quantity = quantity - ? WHERE id = ?", [payload.sacksConsumed, invId]);
            const txId = crypto.randomUUID();
            await connection.query(
              "INSERT INTO inventory_transactions (id, inventory_id, item_id, transaction_type, quantity, reference_id, reference_type, notes, user_id, company_id) VALUES (?, ?, ?, 'out', ?, ?, 'production_run', 'Empty sacks consumed', ?, ?)",
              [txId, invId, payload.sackItemId, payload.sacksConsumed, id, performedBy, run.company_id]
            );
          }
        }
      }
      
      await connection.query('UPDATE production_runs SET status = ? WHERE id = ?', [newStatus, id]);
    }

    await connection.commit();
    res.status(201).json({ id: eventId, newStatus });
  } catch (error) {
    await connection.rollback();
    console.error('Error logging event:', error);
    res.status(500).json({ error: 'Failed to log event', details: error.message });
  } finally {
    connection.release();
  }
};

export const logPackagingSensor = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    
    // Defaulting warehouseId and companyId for the sake of the automated endpoint if not provided
    // In a real scenario, the machineId would be looked up in a machines table to find its associated warehouse/company
    const { machineId, bagSizeKg, bagCount, timestamp, productId, warehouseId, companyId } = req.body;
    
    if (!machineId || !bagSizeKg || !bagCount || !productId || !warehouseId || !companyId) {
      return res.status(400).json({ error: 'Missing required fields for sensor data (need machineId, bagSizeKg, bagCount, productId, warehouseId, companyId)' });
    }

    // 1. Insert into packaging_logs
    const logId = crypto.randomUUID();
    const logTime = timestamp ? new Date(timestamp) : new Date();
    
    await connection.query(
      'INSERT INTO packaging_logs (id, machine_id, product_id, bag_size_kg, bag_count, warehouse_id, company_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [logId, machineId, productId, bagSizeKg, bagCount, warehouseId, companyId, logTime]
    );

    // 2. Increment Finished Goods Inventory
    const [inv] = await connection.query(
      "SELECT * FROM inventory WHERE unit_id = ? AND item_id = ? AND item_type = 'product'",
      [warehouseId, productId]
    );
    
    let invId;
    if (inv.length > 0) {
      invId = inv[0].id;
      await connection.query("UPDATE inventory SET quantity = quantity + ? WHERE id = ?", [bagCount, invId]);
    } else {
      invId = crypto.randomUUID();
      await connection.query(
        "INSERT INTO inventory (id, unit_id, item_id, item_type, quantity, company_id) VALUES (?, ?, ?, 'product', ?, ?)",
        [invId, warehouseId, productId, 'product', bagCount, companyId]
      );
    }
    
    const txId = crypto.randomUUID();
    await connection.query(
      "INSERT INTO inventory_transactions (id, inventory_id, item_id, item_type, transaction_type, quantity, reference_id, reference_type, notes, company_id) VALUES (?, ?, ?, 'product', 'in', ?, ?, 'packaging_sensor', ?, ?)",
      [txId, invId, productId, bagCount, logId, `Auto-captured from ${machineId}`, companyId]
    );

    await connection.commit();
    res.status(201).json({ success: true, logId });
  } catch (error) {
    await connection.rollback();
    console.error('Error in logPackagingSensor:', error);
    res.status(500).json({ error: 'Failed to process sensor data', details: error.message });
  } finally {
    connection.release();
  }
};

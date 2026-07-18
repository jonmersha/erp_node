import { Router } from 'express';

const router = Router();

import procurementRoutes from './routes/procurement.routes.js';
router.use('/procurement', procurementRoutes);
import procurementPlanRoutes from './routes/procurementPlan.routes.js';
router.use('/procurementPlan', procurementPlanRoutes);
import sourcingRoutes from './routes/sourcing.routes.js';
router.use('/sourcing', sourcingRoutes);
import inventoryRoutes from './routes/inventory.routes.js';
router.use('/inventory', inventoryRoutes);
import logisticsRoutes from './routes/logistics.routes.js';
router.use('/logistics', logisticsRoutes);
import rawMaterialRoutes from './routes/rawMaterial.routes.js';
router.use('/rawMaterial', rawMaterialRoutes);
import purchaseOrderRoutes from './routes/purchaseOrder.routes.js';
router.use('/purchaseOrder', purchaseOrderRoutes);
import purchaseRequisitionRoutes from './routes/purchaseRequisition.routes.js';
router.use('/purchaseRequisition', purchaseRequisitionRoutes);
import supplierRoutes from './routes/supplier.routes.js';
router.use('/supplier', supplierRoutes);
import warehouseRoutes from './routes/warehouse.routes.js';
router.use('/warehouse', warehouseRoutes);
import grnRoutes from './routes/grn.routes.js';
router.use('/grn', grnRoutes);
import deliveryNoteRoutes from './routes/deliveryNote.routes.js';
router.use('/deliveryNote', deliveryNoteRoutes);
import weighbridgeRoutes from './routes/weighbridge.routes.js';
router.use('/weighbridge', weighbridgeRoutes);

export default router;

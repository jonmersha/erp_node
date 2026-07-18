import { Router } from 'express';
import supplierRoutes from './supplier.routes.js';
import purchaseOrderRoutes from './purchaseOrder.routes.js';
import rawMaterialRoutes from './rawMaterial.routes.js';

const router = Router();

router.use('/suppliers', supplierRoutes);
router.use('/orders', purchaseOrderRoutes);
router.use('/purchaseOrders', purchaseOrderRoutes);
router.use('/rawMaterials', rawMaterialRoutes);
router.use('/', purchaseOrderRoutes);

export default router;

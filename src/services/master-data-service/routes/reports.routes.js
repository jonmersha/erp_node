import express from 'express';
import {
  getExecutiveReport,
  getSalesReport,
  getProductionReport,
  getInventoryReport,
  getHrReport
} from '../controllers/reports.controller.js';

const router = express.Router();

router.get('/executive', getExecutiveReport);
router.get('/sales', getSalesReport);
router.get('/production', getProductionReport);
router.get('/inventory', getInventoryReport);
router.get('/hr', getHrReport);

export default router;

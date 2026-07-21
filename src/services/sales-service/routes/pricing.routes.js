import express from 'express';
import { getPricingRules, createPricingRule, deletePricingRule, simulatePrice } from '../controllers/pricing.controller.js';
import { authenticateToken } from '../../../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/rules', getPricingRules);
router.post('/rules', createPricingRule);
router.delete('/rules/:id', deletePricingRule);
router.post('/simulate', simulatePrice);

export default router;

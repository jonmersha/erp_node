import { Router } from 'express';
import { getPOLifecycle } from '../controllers/poLifecycle.controller.js';

const router = Router();

router.get('/:id/lifecycle', getPOLifecycle);

export default router;

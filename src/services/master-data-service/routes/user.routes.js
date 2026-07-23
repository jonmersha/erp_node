import { Router } from 'express';
import { getErpUsers, getErpUser, createErpUser, updateErpUser, deleteErpUser } from '../controllers/user.controller.js';

const router = Router();

router.get('/', getErpUsers);
router.get('/:id', getErpUser);
router.post('/', createErpUser);
router.put('/:id', updateErpUser);
router.delete('/:id', deleteErpUser);

export default router;

import { Router } from 'express';
import { getAllCategories, createCategory, updateCategory, deleteCategory } from '../controllers/category.controller.js';

const router = Router();

router.get('/', getAllCategories);
router.post('/', createCategory);
router.put('/:id', updateCategory);
router.delete('/:id', deleteCategory);

export default router;

import { Router } from 'express';
import { getAllProducts, createProduct, updateProduct, deleteProduct } from '../controllers/product.controller.js';

const router = Router();

router.get('/', getAllProducts);
router.post('/', createProduct);
router.put('/:id', updateProduct);
router.delete('/:id', deleteProduct);

export default router;

import { Router } from 'express';
import multer from 'multer';
import { getAllProducts, createProduct, updateProduct, deleteProduct, downloadTemplate, uploadProducts } from '../controllers/product.controller.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get('/template', downloadTemplate);
router.post('/upload', upload.single('file'), uploadProducts);
router.get('/', getAllProducts);
router.post('/', createProduct);
router.put('/:id', updateProduct);
router.delete('/:id', deleteProduct);

export default router;

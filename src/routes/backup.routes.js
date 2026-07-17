import express from 'express';
import multer from 'multer';
import { exportSql, importSql, exportCsv, importCsv } from '../controllers/backup.controller.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get('/sql', exportSql);
router.post('/sql', upload.single('file'), importSql);

router.get('/csv', exportCsv);
router.post('/csv', upload.single('file'), importCsv);

export default router;

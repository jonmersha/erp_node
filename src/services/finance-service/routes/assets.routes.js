import express from 'express';
import { getAssets, createAsset, updateAssetStatus } from '../controllers/assets.controller.js';

const router = express.Router();

router.get('/', getAssets);
router.post('/', createAsset);
router.put('/:id/status', updateAssetStatus);

export default router;

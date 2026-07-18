import { Router } from 'express';
import { getAllDeliveryNotes, createDeliveryNote } from '../controllers/deliveryNote.controller.js';

const router = Router();

router.get('/', getAllDeliveryNotes);
router.post('/', createDeliveryNote);

export default router;

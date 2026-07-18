import { Router } from 'express';
import { 
  getAllRFQs, 
  createRFQ, 
  getBidsForRFQ, 
  submitBid, 
  awardBid 
} from '../controllers/sourcing.controller.js';

const router = Router();

router.get('/rfqs', getAllRFQs);
router.post('/rfqs', createRFQ);

router.get('/rfqs/:rfqId/bids', getBidsForRFQ);
router.post('/rfqs/:rfqId/bids', submitBid);
router.put('/rfqs/:rfqId/bids/:bidId/award', awardBid);

export default router;

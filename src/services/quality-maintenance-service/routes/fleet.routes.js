import express from 'express';
import { 
  getVehicles, createVehicle, updateVehicle,
  getVehicleRequests, createVehicleRequest, updateVehicleRequest, approveVehicleRequest, rejectVehicleRequest,
  getFleetConsumptions, createFleetConsumption, updateFleetConsumption
} from '../controllers/fleet.controller.js';
import { authenticateToken } from '../../../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/vehicles', getVehicles);
router.post('/vehicles', createVehicle);
router.put('/vehicles/:id', updateVehicle);

router.get('/requests', getVehicleRequests);
router.post('/requests', createVehicleRequest);
router.put('/requests/:id', updateVehicleRequest);
router.post('/requests/:id/approve', approveVehicleRequest);
router.post('/requests/:id/reject', rejectVehicleRequest);

router.get('/consumptions', getFleetConsumptions);
router.post('/consumptions', createFleetConsumption);
router.put('/consumptions/:id', updateFleetConsumption);

export default router;

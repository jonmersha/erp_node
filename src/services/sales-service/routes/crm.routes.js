import express from 'express';
import {
  getCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getTickets,
  createTicket,
  updateTicket,
  getInteractions,
  createInteraction
} from '../controllers/crm.controller.js';

const router = express.Router();

router.get('/customers', getCustomers);
router.post('/customers', createCustomer);
router.put('/customers/:id', updateCustomer);
router.delete('/customers/:id', deleteCustomer);

router.get('/tickets', getTickets);
router.post('/tickets', createTicket);
router.put('/tickets/:id', updateTicket);

router.get('/interactions', getInteractions);
router.post('/interactions', createInteraction);

export default router;

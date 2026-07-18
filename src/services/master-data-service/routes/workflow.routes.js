import { Router } from 'express';
import { 
  getWorkflowTemplates, 
  getWorkflowTemplateWithStages, 
  createWorkflowTemplate, 
  updateWorkflowTemplate, 
  deleteWorkflowTemplate 
} from '../controllers/workflow.controller.js';

const router = Router();

router.get('/', getWorkflowTemplates);
router.post('/', createWorkflowTemplate);
router.get('/:id', getWorkflowTemplateWithStages);
router.put('/:id', updateWorkflowTemplate);
router.delete('/:id', deleteWorkflowTemplate);

export default router;

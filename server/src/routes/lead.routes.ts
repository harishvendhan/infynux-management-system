import { Router } from 'express';
import {
  getLeads,
  getLeadById,
  createLead,
  updateLead,
  convertLeadToClient,
  deleteLead,
} from '../controllers/lead.controller';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

router.get('/', getLeads);
router.post('/', createLead);
router.get('/:id', getLeadById);
router.patch('/:id', updateLead);
router.post('/:id/convert', convertLeadToClient);
router.delete('/:id', deleteLead);

export default router;

import { Router } from 'express';
import {
  getPayments,
  getDuePaymentsGrouped,
  createPayment,
  updatePayment,
  deletePayment,
} from '../controllers/payment.controller';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

router.get('/', getPayments);
router.get('/due', getDuePaymentsGrouped);
router.post('/', createPayment);
router.patch('/:id', updatePayment);
router.delete('/:id', deletePayment);

export default router;

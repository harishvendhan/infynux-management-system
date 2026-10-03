import { Router } from 'express';
import { getDashboardSummary, getRevenueChart } from '../controllers/dashboard.controller';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

router.get('/summary', getDashboardSummary);
router.get('/revenue-chart', getRevenueChart);

export default router;

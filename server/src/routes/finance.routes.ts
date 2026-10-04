import { Router } from 'express';
import {
  getExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
  getEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getSalaries,
  createSalary,
  updateSalary,
  deleteSalary,
  getFinancialReports,
} from '../controllers/finance.controller';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

// Expenses
router.get('/expenses', getExpenses);
router.post('/expenses', createExpense);
router.patch('/expenses/:id', updateExpense);
router.delete('/expenses/:id', deleteExpense);

// Employees
router.get('/employees', getEmployees);
router.post('/employees', createEmployee);
router.patch('/employees/:id', updateEmployee);
router.delete('/employees/:id', deleteEmployee);

// Salaries
router.get('/salaries', getSalaries);
router.post('/salaries', createSalary);
router.patch('/salaries/:id', updateSalary);
router.delete('/salaries/:id', deleteSalary);

// Reports
router.get('/reports/monthly', getFinancialReports);

export default router;

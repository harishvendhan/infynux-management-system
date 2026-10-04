import { Request, Response } from 'express';
import { prisma } from '../prisma';
import { calculateSalaryFinal, calculateMonthlyNet } from '../services/calculation.service';

// --- EXPENSES ---
export async function getExpenses(req: Request, res: Response): Promise<void> {
  try {
    const { category, employeeId, from, to } = req.query;

    const where: any = {};
    if (category && typeof category === 'string') {
      where.category = category;
    }
    if (employeeId && typeof employeeId === 'string') {
      where.employeeId = employeeId;
    }
    if (from || to) {
      where.date = {};
      if (from) where.date.gte = new Date(from as string);
      if (to) where.date.lte = new Date(to as string);
    }

    const expenses = await prisma.expense.findMany({
      where,
      include: {
        employee: { select: { id: true, name: true, roleTitle: true } },
      },
      orderBy: { date: 'desc' },
    });

    res.status(200).json({ data: expenses, error: null });
  } catch (error: any) {
    res.status(500).json({ error: { message: error.message, code: 'SERVER_ERROR' } });
  }
}

export async function createExpense(req: Request, res: Response): Promise<void> {
  try {
    const { date, category, description, amount, paymentMethod, employeeId, notes } = req.body;

    if (!date || !category || !description || amount === undefined) {
      res.status(400).json({
        error: { message: 'Date, category, description, and amount are required.', code: 'INVALID_INPUT' },
      });
      return;
    }

    const expense = await prisma.expense.create({
      data: {
        date: new Date(date),
        category,
        description,
        amount: Number(amount),
        paymentMethod: paymentMethod || 'Corporate Card',
        employeeId: employeeId || null,
        notes,
      },
    });

    await prisma.activityLog.create({
      data: {
        entityType: 'EXPENSE',
        entityId: expense.id,
        action: 'CREATE',
        summary: `Logged expense "${expense.description}" (₹${Number(expense.amount).toLocaleString('en-IN')}) under ${expense.category}`,
      },
    });

    res.status(201).json({ data: expense, error: null });
  } catch (error: any) {
    res.status(500).json({ error: { message: error.message, code: 'SERVER_ERROR' } });
  }
}

export async function updateExpense(req: Request, res: Response): Promise<void> {
  try {
    const id = req.params.id as string;
    const { date, category, description, amount, paymentMethod, employeeId, notes } = req.body;

    const data: any = {};
    if (date !== undefined) data.date = new Date(date);
    if (category !== undefined) data.category = category;
    if (description !== undefined) data.description = description;
    if (amount !== undefined) data.amount = Number(amount);
    if (paymentMethod !== undefined) data.paymentMethod = paymentMethod;
    if (employeeId !== undefined) data.employeeId = employeeId || null;
    if (notes !== undefined) data.notes = notes;

    const updated = await prisma.expense.update({
      where: { id },
      data,
    });

    res.status(200).json({ data: updated, error: null });
  } catch (error: any) {
    res.status(500).json({ error: { message: error.message, code: 'SERVER_ERROR' } });
  }
}

export async function deleteExpense(req: Request, res: Response): Promise<void> {
  try {
    const id = req.params.id as string;
    await prisma.expense.delete({ where: { id } });
    res.status(200).json({ data: { message: 'Expense deleted successfully.' }, error: null });
  } catch (error: any) {
    res.status(500).json({ error: { message: error.message, code: 'SERVER_ERROR' } });
  }
}

// --- EMPLOYEES ---
export async function getEmployees(req: Request, res: Response): Promise<void> {
  try {
    const employees = await prisma.employee.findMany({
      include: {
        projects: {
          select: { id: true, name: true, status: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    res.status(200).json({ data: employees, error: null });
  } catch (error: any) {
    res.status(500).json({ error: { message: error.message, code: 'SERVER_ERROR' } });
  }
}

export async function createEmployee(req: Request, res: Response): Promise<void> {
  try {
    const { name, roleTitle, phone, email, baseSalary } = req.body;

    if (!name || !roleTitle || baseSalary === undefined) {
      res.status(400).json({
        error: { message: 'Name, role title, and base salary are required.', code: 'INVALID_INPUT' },
      });
      return;
    }

    const employee = await prisma.employee.create({
      data: {
        name,
        roleTitle,
        phone,
        email,
        baseSalary: Number(baseSalary),
      },
    });

    res.status(201).json({ data: employee, error: null });
  } catch (error: any) {
    res.status(500).json({ error: { message: error.message, code: 'SERVER_ERROR' } });
  }
}

export async function updateEmployee(req: Request, res: Response): Promise<void> {
  try {
    const id = req.params.id as string;
    const { name, roleTitle, phone, email, baseSalary, isActive } = req.body;

    const data: any = {};
    if (name !== undefined) data.name = name;
    if (roleTitle !== undefined) data.roleTitle = roleTitle;
    if (phone !== undefined) data.phone = phone;
    if (email !== undefined) data.email = email;
    if (baseSalary !== undefined) data.baseSalary = Number(baseSalary);
    if (isActive !== undefined) data.isActive = isActive;

    const updated = await prisma.employee.update({
      where: { id },
      data,
    });

    res.status(200).json({ data: updated, error: null });
  } catch (error: any) {
    res.status(500).json({ error: { message: error.message, code: 'SERVER_ERROR' } });
  }
}

export async function deleteEmployee(req: Request, res: Response): Promise<void> {
  try {
    const id = req.params.id as string;

    const salaryCount = await prisma.salary.count({ where: { employeeId: id } });
    if (salaryCount > 0) {
      res.status(400).json({
        error: {
          message: 'Cannot delete employee with existing salary records. Please deactivate them instead.',
          code: 'CONFLICT',
        },
      });
      return;
    }

    await prisma.project.updateMany({
      where: { assignedEmployeeId: id },
      data: { assignedEmployeeId: null },
    });

    await prisma.expense.updateMany({
      where: { employeeId: id },
      data: { employeeId: null },
    });

    await prisma.employee.delete({ where: { id } });
    res.status(200).json({ data: { message: 'Employee deleted successfully.' }, error: null });
  } catch (error: any) {
    res.status(500).json({ error: { message: error.message, code: 'SERVER_ERROR' } });
  }
}

// --- SALARIES ---
export async function getSalaries(req: Request, res: Response): Promise<void> {
  try {
    const { month, employeeId } = req.query;

    const where: any = {};
    if (month && typeof month === 'string') {
      where.month = month;
    }
    if (employeeId && typeof employeeId === 'string') {
      where.employeeId = employeeId;
    }

    const salaries = await prisma.salary.findMany({
      where,
      include: {
        employee: { select: { id: true, name: true, roleTitle: true } },
      },
      orderBy: { month: 'desc' },
    });

    res.status(200).json({ data: salaries, error: null });
  } catch (error: any) {
    res.status(500).json({ error: { message: error.message, code: 'SERVER_ERROR' } });
  }
}

export async function createSalary(req: Request, res: Response): Promise<void> {
  try {
    const { employeeId, month, baseSalary, bonus, deductions, status, paidOn, notes } = req.body;

    if (!employeeId || !month || baseSalary === undefined) {
      res.status(400).json({
        error: { message: 'Employee ID, month (YYYY-MM), and base salary are required.', code: 'INVALID_INPUT' },
      });
      return;
    }

    const finalAmount = calculateSalaryFinal(baseSalary, bonus, deductions);

    const salary = await prisma.salary.create({
      data: {
        employeeId,
        month,
        baseSalary: Number(baseSalary),
        bonus: Number(bonus || 0),
        deductions: Number(deductions || 0),
        finalAmount,
        status: status || 'PENDING',
        paidOn: paidOn ? new Date(paidOn) : null,
        notes,
      },
    });

    res.status(201).json({ data: salary, error: null });
  } catch (error: any) {
    res.status(500).json({ error: { message: error.message, code: 'SERVER_ERROR' } });
  }
}

export async function updateSalary(req: Request, res: Response): Promise<void> {
  try {
    const id = req.params.id as string;
    const { baseSalary, bonus, deductions, status, paidOn, notes } = req.body;

    const existing = await prisma.salary.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: { message: 'Salary record not found.', code: 'NOT_FOUND' } });
      return;
    }

    const base = baseSalary !== undefined ? Number(baseSalary) : Number(existing.baseSalary);
    const bon = bonus !== undefined ? Number(bonus) : Number(existing.bonus);
    const ded = deductions !== undefined ? Number(deductions) : Number(existing.deductions);
    const finalAmount = calculateSalaryFinal(base, bon, ded);

    const updated = await prisma.salary.update({
      where: { id },
      data: {
        baseSalary: base,
        bonus: bon,
        deductions: ded,
        finalAmount,
        status: status !== undefined ? status : existing.status,
        paidOn: paidOn !== undefined ? (paidOn ? new Date(paidOn) : null) : existing.paidOn,
        notes: notes !== undefined ? notes : existing.notes,
      },
    });

    res.status(200).json({ data: updated, error: null });
  } catch (error: any) {
    res.status(500).json({ error: { message: error.message, code: 'SERVER_ERROR' } });
  }
}

export async function deleteSalary(req: Request, res: Response): Promise<void> {
  try {
    const id = req.params.id as string;
    await prisma.salary.delete({ where: { id } });
    res.status(200).json({ data: { message: 'Salary record deleted successfully.' }, error: null });
  } catch (error: any) {
    res.status(500).json({ error: { message: error.message, code: 'SERVER_ERROR' } });
  }
}

// --- REPORTS ---
export async function getFinancialReports(req: Request, res: Response): Promise<void> {
  try {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const ymString = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
    const startOfMonth = new Date(currentYear, currentMonth, 1);
    const endOfMonth = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59, 999);

    // Payments received this month
    const payments = await prisma.payment.findMany({
      where: {
        deletedAt: null,
        status: { in: ['PAID', 'ADVANCE'] },
        receivedDate: { gte: startOfMonth, lte: endOfMonth },
      },
    });
    const monthlyIncome = payments.reduce((sum, p) => sum + Number(p.amount), 0);

    // Expenses this month
    const expenses = await prisma.expense.findMany({
      where: { date: { gte: startOfMonth, lte: endOfMonth } },
    });
    const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

    // Category breakdown
    const categoryMap: Record<string, number> = {};
    expenses.forEach((e) => {
      categoryMap[e.category] = (categoryMap[e.category] || 0) + Number(e.amount);
    });
    const categoryBreakdown = Object.entries(categoryMap).map(([category, amount]) => ({
      category,
      amount,
    }));

    // Salaries paid this month
    const salaries = await prisma.salary.findMany({
      where: { month: ymString, status: 'PAID' },
    });
    const totalSalaries = salaries.reduce((sum, s) => sum + Number(s.finalAmount), 0);

    const netProfit = calculateMonthlyNet(monthlyIncome, totalExpenses, totalSalaries);

    res.status(200).json({
      data: {
        month: ymString,
        income: monthlyIncome,
        expenses: totalExpenses,
        salaries: totalSalaries,
        netProfit,
        categoryBreakdown,
      },
      error: null,
    });
  } catch (error: any) {
    res.status(500).json({ error: { message: error.message, code: 'SERVER_ERROR' } });
  }
}

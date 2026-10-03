import { Request, Response } from 'express';
import { prisma } from '../prisma';
import {
  calculateProjectPaid,
  calculateProjectDue,
  calculateMonthlyNet,
  isPaymentOverdue,
} from '../services/calculation.service';

export async function getDashboardSummary(req: Request, res: Response): Promise<void> {
  try {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const startOfMonth = new Date(currentYear, currentMonth, 1);
    const endOfMonth = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59, 999);

    // 1. Month Revenue: sum of payments with status PAID or ADVANCE received inside this month
    const paidPaymentsThisMonth = await prisma.payment.findMany({
      where: {
        deletedAt: null,
        status: { in: ['PAID', 'ADVANCE'] },
        receivedDate: { gte: startOfMonth, lte: endOfMonth },
      },
      select: { amount: true },
    });
    const revenueThisMonth = paidPaymentsThisMonth.reduce((sum, p) => sum + Number(p.amount), 0);

    // 2. Pending dues: sum of unpaid amounts (DUE + OVERDUE + PARTIAL) across all active projects
    const unpaidPayments = await prisma.payment.findMany({
      where: {
        deletedAt: null,
        status: { in: ['DUE', 'OVERDUE', 'PARTIAL'] },
      },
      select: { amount: true },
    });
    const pendingAmount = unpaidPayments.reduce((sum, p) => sum + Number(p.amount), 0);

    // 3. Expenses this month
    const expensesThisMonthRecords = await prisma.expense.findMany({
      where: {
        date: { gte: startOfMonth, lte: endOfMonth },
      },
      select: { amount: true },
    });
    const expensesThisMonth = expensesThisMonthRecords.reduce((sum, e) => sum + Number(e.amount), 0);

    // 4. Salaries paid this month
    const ymString = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
    const salariesThisMonth = await prisma.salary.findMany({
      where: {
        month: ymString,
        status: 'PAID',
      },
      select: { finalAmount: true },
    });
    const salariesPaidThisMonth = salariesThisMonth.reduce((sum, s) => sum + Number(s.finalAmount), 0);

    // 5. Net Profit
    const netProfit = calculateMonthlyNet(revenueThisMonth, expensesThisMonth, salariesPaidThisMonth);

    // 6. Active Clients & Active Projects
    const activeProjectsCount = await prisma.project.count({
      where: { status: { in: ['PLANNING', 'IN_PROGRESS', 'WAITING_FOR_CLIENT'] } },
    });

    const activeClientsCount = await prisma.client.count({
      where: {
        isActive: true,
        projects: { some: { status: { in: ['PLANNING', 'IN_PROGRESS', 'WAITING_FOR_CLIENT'] } } },
      },
    });

    // 7. Today's Tasks & Events
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const todaysTasks = await prisma.event.findMany({
      where: {
        startAt: { gte: startOfToday, lte: endOfToday },
        status: { not: 'CANCELLED' },
      },
      include: {
        client: { select: { id: true, name: true, company: true } },
        project: { select: { id: true, name: true } },
      },
      orderBy: { startAt: 'asc' },
    });

    // 8. Upcoming Payments (Next due payments)
    const upcomingPayments = await prisma.payment.findMany({
      where: {
        deletedAt: null,
        status: { in: ['DUE', 'OVERDUE'] },
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            client: { select: { id: true, name: true, company: true } },
          },
        },
      },
      orderBy: { dueDate: 'asc' },
      take: 5,
    });

    // 9. Recent Activity
    const recentActivity = await prisma.activityLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 6,
    });

    res.status(200).json({
      data: {
        kpis: {
          revenueThisMonth,
          pendingAmount,
          expensesThisMonth,
          salariesPaidThisMonth,
          netProfit,
          activeClientsCount,
          activeProjectsCount,
        },
        todaysTasks,
        upcomingPayments,
        recentActivity,
      },
      error: null,
    });
  } catch (error: any) {
    console.error('Error in getDashboardSummary:', error);
    res.status(500).json({ error: { message: error.message, code: 'SERVER_ERROR' } });
  }
}

export async function getRevenueChart(req: Request, res: Response): Promise<void> {
  try {
    const now = new Date();
    const monthsData: { month: string; revenue: number; expenses: number }[] = [];

    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = d.getFullYear();
      const month = d.getMonth();
      const start = new Date(year, month, 1);
      const end = new Date(year, month + 1, 0, 23, 59, 59, 999);
      const monthLabel = d.toLocaleString('en-US', { month: 'short' });

      const payments = await prisma.payment.findMany({
        where: {
          deletedAt: null,
          status: { in: ['PAID', 'ADVANCE'] },
          receivedDate: { gte: start, lte: end },
        },
        select: { amount: true },
      });
      const rev = payments.reduce((sum, p) => sum + Number(p.amount), 0);

      const expenses = await prisma.expense.findMany({
        where: {
          date: { gte: start, lte: end },
        },
        select: { amount: true },
      });
      const exp = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

      monthsData.push({
        month: monthLabel,
        revenue: rev,
        expenses: exp,
      });
    }

    res.status(200).json({ data: monthsData, error: null });
  } catch (error: any) {
    res.status(500).json({ error: { message: error.message, code: 'SERVER_ERROR' } });
  }
}

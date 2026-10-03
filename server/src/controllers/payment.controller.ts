import { Request, Response } from 'express';
import { prisma } from '../prisma';
import { isPaymentOverdue, calculateProjectPaid } from '../services/calculation.service';

export async function getPayments(req: Request, res: Response): Promise<void> {
  try {
    const { projectId, clientId, status, from, to } = req.query;

    const where: any = { deletedAt: null };
    if (projectId && typeof projectId === 'string') {
      where.projectId = projectId;
    }
    if (clientId && typeof clientId === 'string') {
      where.project = { clientId };
    }
    if (status && typeof status === 'string') {
      where.status = status;
    }
    if (from || to) {
      where.dueDate = {};
      if (from) where.dueDate.gte = new Date(from as string);
      if (to) where.dueDate.lte = new Date(to as string);
    }

    const payments = await prisma.payment.findMany({
      where,
      include: {
        project: {
          select: {
            id: true,
            name: true,
            totalValue: true,
            client: { select: { id: true, name: true, company: true } },
          },
        },
      },
      orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
    });

    res.status(200).json({ data: payments, error: null });
  } catch (error: any) {
    res.status(500).json({ error: { message: error.message, code: 'SERVER_ERROR' } });
  }
}

export async function getDuePaymentsGrouped(req: Request, res: Response): Promise<void> {
  try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);

    // End of current week (Sunday)
    const dayOfWeek = now.getDay();
    const daysUntilEndOfWeek = 7 - dayOfWeek;
    const endOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() + daysUntilEndOfWeek, 23, 59, 59, 999);

    const unpaid = await prisma.payment.findMany({
      where: {
        deletedAt: null,
        status: { in: ['DUE', 'OVERDUE', 'PARTIAL'] },
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            totalValue: true,
            client: { select: { id: true, name: true, company: true, phone: true } },
          },
        },
      },
      orderBy: { dueDate: 'asc' },
    });

    const overdue: typeof unpaid = [];
    const dueThisWeek: typeof unpaid = [];
    const upcoming: typeof unpaid = [];

    unpaid.forEach((p) => {
      if (!p.dueDate) {
        upcoming.push(p);
        return;
      }
      const due = new Date(p.dueDate);
      if (due < startOfToday) {
        overdue.push(p);
      } else if (due <= endOfWeek) {
        dueThisWeek.push(p);
      } else {
        upcoming.push(p);
      }
    });

    res.status(200).json({
      data: {
        overdue,
        dueThisWeek,
        upcoming,
        counts: {
          overdueCount: overdue.length,
          dueThisWeekCount: dueThisWeek.length,
          upcomingCount: upcoming.length,
        },
      },
      error: null,
    });
  } catch (error: any) {
    res.status(500).json({ error: { message: error.message, code: 'SERVER_ERROR' } });
  }
}

export async function createPayment(req: Request, res: Response): Promise<void> {
  try {
    const { projectId, label, amount, dueDate, receivedDate, status, method, notes } = req.body;

    if (!projectId || !label || amount === undefined) {
      res.status(400).json({
        error: { message: 'Project ID, label, and amount are required.', code: 'INVALID_INPUT' },
      });
      return;
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        payments: { where: { deletedAt: null } },
        client: { select: { name: true } },
      },
    });

    if (!project) {
      res.status(404).json({ error: { message: 'Project not found.', code: 'NOT_FOUND' } });
      return;
    }

    const currentPaid = calculateProjectPaid(project.payments as any);
    const numAmount = Number(amount);
    let warning: string | undefined;

    if (numAmount + currentPaid > Number(project.totalValue)) {
      warning = `Total payments (₹${numAmount + currentPaid}) exceed project total value (₹${Number(project.totalValue)}).`;
    }

    const payment = await prisma.payment.create({
      data: {
        projectId,
        label,
        amount: numAmount,
        dueDate: dueDate ? new Date(dueDate) : null,
        receivedDate: receivedDate ? new Date(receivedDate) : null,
        status: status || 'DUE',
        method: method || null,
        notes: notes || null,
      },
    });

    // Auto-create calendar event if it is a scheduled due date
    if (payment.dueDate && payment.status === 'DUE') {
      await prisma.event.create({
        data: {
          type: 'PAYMENT',
          title: `Payment Due: ${payment.label} (₹${numAmount.toLocaleString('en-IN')}) - ${project.name}`,
          clientId: project.clientId,
          projectId: project.id,
          startAt: payment.dueDate,
          allDay: true,
          reminderMinutes: 1440, // 1 day before
        },
      });
    }

    await prisma.activityLog.create({
      data: {
        entityType: 'PAYMENT',
        entityId: payment.id,
        action: 'CREATE',
        summary: `Recorded ${payment.status} payment "${payment.label}" of ₹${numAmount.toLocaleString('en-IN')} for project "${project.name}"`,
      },
    });

    res.status(201).json({ data: payment, warning, error: null });
  } catch (error: any) {
    res.status(500).json({ error: { message: error.message, code: 'SERVER_ERROR' } });
  }
}

export async function updatePayment(req: Request, res: Response): Promise<void> {
  try {
    const id = req.params.id as string;
    const { label, amount, dueDate, receivedDate, status, method, notes } = req.body;

    const data: any = {};
    if (label !== undefined) data.label = label;
    if (amount !== undefined) data.amount = Number(amount);
    if (dueDate !== undefined) data.dueDate = dueDate ? new Date(dueDate) : null;
    if (receivedDate !== undefined) data.receivedDate = receivedDate ? new Date(receivedDate) : null;
    if (status !== undefined) {
      data.status = status;
      if (status === 'PAID' && !receivedDate) {
        data.receivedDate = new Date();
      }
    }
    if (method !== undefined) data.method = method;
    if (notes !== undefined) data.notes = notes;

    const updated = await prisma.payment.update({
      where: { id },
      data,
      include: {
        project: { select: { name: true } },
      },
    });

    await prisma.activityLog.create({
      data: {
        entityType: 'PAYMENT',
        entityId: updated.id,
        action: 'UPDATE',
        summary: `Updated payment "${updated.label}" status to ${updated.status} (₹${Number(updated.amount).toLocaleString('en-IN')})`,
      },
    });

    res.status(200).json({ data: updated, error: null });
  } catch (error: any) {
    res.status(500).json({ error: { message: error.message, code: 'SERVER_ERROR' } });
  }
}

export async function deletePayment(req: Request, res: Response): Promise<void> {
  try {
    const id = req.params.id as string;

    // PRD Section 7 Rule: Deleting a payment is a soft delete so history is preserved
    const softDeleted = await prisma.payment.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await prisma.activityLog.create({
      data: {
        entityType: 'PAYMENT',
        entityId: id,
        action: 'DELETE',
        summary: `Soft-deleted payment record "${softDeleted.label}" (history preserved)`,
      },
    });

    res.status(200).json({ data: { message: 'Payment archived (soft deleted).' }, error: null });
  } catch (error: any) {
    res.status(500).json({ error: { message: error.message, code: 'SERVER_ERROR' } });
  }
}

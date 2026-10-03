import { Request, Response } from 'express';
import { prisma } from '../prisma';
import { calculateProjectPaid, calculateProjectDue } from '../services/calculation.service';

export async function getProjects(req: Request, res: Response): Promise<void> {
  try {
    const { status, projectType, clientId, priority, search } = req.query;

    const where: any = {};
    if (status && typeof status === 'string') {
      where.status = status;
    }
    if (projectType && typeof projectType === 'string') {
      where.projectType = projectType;
    }
    if (clientId && typeof clientId === 'string') {
      where.clientId = clientId;
    }
    if (priority && typeof priority === 'string') {
      where.priority = priority;
    }
    if (search && typeof search === 'string') {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { client: { name: { contains: search, mode: 'insensitive' } } },
        { client: { company: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const projects = await prisma.project.findMany({
      where,
      include: {
        client: { select: { id: true, name: true, company: true, phone: true } },
        assignedEmployee: { select: { id: true, name: true, roleTitle: true } },
        payments: {
          where: { deletedAt: null },
          select: { id: true, amount: true, status: true, dueDate: true, receivedDate: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const enriched = projects.map((p) => {
      const amountPaid = calculateProjectPaid(p.payments as any);
      const amountDue = calculateProjectDue(p.totalValue, p.payments as any);

      return {
        ...p,
        metrics: {
          amountPaid,
          amountDue,
          progressPercentage: Number(p.totalValue) > 0 ? Math.round((amountPaid / Number(p.totalValue)) * 100) : 0,
        },
      };
    });

    res.status(200).json({ data: enriched, error: null });
  } catch (error: any) {
    res.status(500).json({ error: { message: error.message, code: 'SERVER_ERROR' } });
  }
}

export async function getProjectById(req: Request, res: Response): Promise<void> {
  try {
    const id = req.params.id as string;

    const project = await (prisma.project as any).findUnique({
      where: { id },
      include: {
        client: true,
        assignedEmployee: true,
        payments: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'asc' },
        },
        events: {
          orderBy: { startAt: 'desc' },
        },
      },
    });

    if (!project) {
      res.status(404).json({ error: { message: 'Project not found.', code: 'NOT_FOUND' } });
      return;
    }

    const amountPaid = calculateProjectPaid(project.payments || []);
    const amountDue = calculateProjectDue(project.totalValue, project.payments || []);

    res.status(200).json({
      data: {
        ...project,
        metrics: {
          amountPaid,
          amountDue,
          progressPercentage:
            Number(project.totalValue) > 0 ? Math.round((amountPaid / Number(project.totalValue)) * 100) : 0,
        },
      },
      error: null,
    });
  } catch (error: any) {
    res.status(500).json({ error: { message: error.message, code: 'SERVER_ERROR' } });
  }
}

export async function createProject(req: Request, res: Response): Promise<void> {
  try {
    const {
      name,
      clientId,
      projectType,
      status,
      priority,
      startDate,
      expectedEndDate,
      totalValue,
      assignedEmployeeId,
      notes,
    } = req.body;

    if (!name || !clientId || totalValue === undefined) {
      res.status(400).json({
        error: { message: 'Project name, client, and total value are required.', code: 'INVALID_INPUT' },
      });
      return;
    }

    const project = await prisma.project.create({
      data: {
        name,
        clientId,
        projectType: projectType || 'WEBSITE',
        status: status || 'PLANNING',
        priority: priority || 'MEDIUM',
        startDate: startDate ? new Date(startDate) : null,
        expectedEndDate: expectedEndDate ? new Date(expectedEndDate) : null,
        totalValue: Number(totalValue),
        assignedEmployeeId: assignedEmployeeId || null,
        notes,
      },
      include: {
        client: { select: { name: true, company: true } },
      },
    });

    await prisma.activityLog.create({
      data: {
        entityType: 'PROJECT',
        entityId: project.id,
        action: 'CREATE',
        summary: `Created project "${project.name}" (₹${Number(project.totalValue).toLocaleString('en-IN')}) for ${project.client.name}`,
      },
    });

    res.status(201).json({ data: project, error: null });
  } catch (error: any) {
    res.status(500).json({ error: { message: error.message, code: 'SERVER_ERROR' } });
  }
}

export async function updateProject(req: Request, res: Response): Promise<void> {
  try {
    const id = req.params.id as string;
    const {
      name,
      projectType,
      status,
      priority,
      startDate,
      expectedEndDate,
      totalValue,
      assignedEmployeeId,
      notes,
    } = req.body;

    const data: any = {};
    if (name !== undefined) data.name = name;
    if (projectType !== undefined) data.projectType = projectType;
    if (status !== undefined) data.status = status;
    if (priority !== undefined) data.priority = priority;
    if (startDate !== undefined) data.startDate = startDate ? new Date(startDate) : null;
    if (expectedEndDate !== undefined) data.expectedEndDate = expectedEndDate ? new Date(expectedEndDate) : null;
    if (totalValue !== undefined) data.totalValue = Number(totalValue);
    if (assignedEmployeeId !== undefined) data.assignedEmployeeId = assignedEmployeeId || null;
    if (notes !== undefined) data.notes = notes;

    const updated = await prisma.project.update({
      where: { id },
      data,
    });

    await prisma.activityLog.create({
      data: {
        entityType: 'PROJECT',
        entityId: updated.id,
        action: 'UPDATE',
        summary: `Updated project "${updated.name}" details / status`,
      },
    });

    res.status(200).json({ data: updated, error: null });
  } catch (error: any) {
    res.status(500).json({ error: { message: error.message, code: 'SERVER_ERROR' } });
  }
}

export async function deleteProject(req: Request, res: Response): Promise<void> {
  try {
    const id = req.params.id as string;

    const paymentsCount = await prisma.payment.count({
      where: { projectId: id, deletedAt: null },
    });

    if (paymentsCount > 0) {
      res.status(400).json({
        error: {
          message: 'Cannot delete project with payment transactions. Mark as Cancelled instead.',
          code: 'PAYMENTS_EXIST',
        },
      });
      return;
    }

    await prisma.project.delete({ where: { id } });

    await prisma.activityLog.create({
      data: {
        entityType: 'PROJECT',
        entityId: id,
        action: 'DELETE',
        summary: `Deleted project ID ${id}`,
      },
    });

    res.status(200).json({ data: { message: 'Project deleted successfully.' }, error: null });
  } catch (error: any) {
    res.status(500).json({ error: { message: error.message, code: 'SERVER_ERROR' } });
  }
}

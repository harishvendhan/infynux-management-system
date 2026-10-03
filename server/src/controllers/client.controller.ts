import { Request, Response } from 'express';
import { prisma } from '../prisma';
import { calculateClientTotalBusiness, calculateProjectPaid } from '../services/calculation.service';

export async function getClients(req: Request, res: Response): Promise<void> {
  try {
    const { search, isActive } = req.query;

    const where: any = {};
    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }
    if (search && typeof search === 'string') {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { company: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const clients = await prisma.client.findMany({
      where,
      include: {
        projects: {
          select: {
            id: true,
            name: true,
            totalValue: true,
            status: true,
            payments: {
              where: { deletedAt: null },
              select: { amount: true, status: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const enrichedClients = clients.map((client) => {
      const totalBusiness = calculateClientTotalBusiness(client.projects as any);
      let totalPaid = 0;
      client.projects.forEach((proj: any) => {
        totalPaid += calculateProjectPaid(proj.payments as any);
      });
      const totalPending = Math.max(0, totalBusiness - totalPaid);

      return {
        ...client,
        metrics: {
          totalBusiness,
          totalPaid,
          totalPending,
          projectCount: client.projects.length,
        },
      };
    });

    res.status(200).json({ data: enrichedClients, error: null });
  } catch (error: any) {
    res.status(500).json({ error: { message: error.message, code: 'SERVER_ERROR' } });
  }
}

export async function getClientById(req: Request, res: Response): Promise<void> {
  try {
    const id = req.params.id as string;

    const client = await (prisma.client as any).findUnique({
      where: { id },
      include: {
        projects: {
          include: {
            assignedEmployee: { select: { id: true, name: true, roleTitle: true } },
            payments: {
              where: { deletedAt: null },
              orderBy: { createdAt: 'desc' },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        followUps: {
          orderBy: { dueAt: 'desc' },
        },
        events: {
          orderBy: { startAt: 'desc' },
        },
      },
    });

    if (!client) {
      res.status(404).json({ error: { message: 'Client not found.', code: 'NOT_FOUND' } });
      return;
    }

    const totalBusiness = calculateClientTotalBusiness(client.projects || []);
    let totalPaid = 0;
    (client.projects || []).forEach((proj: any) => {
      totalPaid += calculateProjectPaid(proj.payments || []);
    });
    const totalPending = Math.max(0, totalBusiness - totalPaid);

    // Fetch activity logs for this client
    const activityLogs = await prisma.activityLog.findMany({
      where: {
        OR: [
          { entityType: 'CLIENT', entityId: id },
          { entityType: 'PROJECT', entityId: { in: (client.projects || []).map((p: any) => p.id) } },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    res.status(200).json({
      data: {
        ...client,
        summary: {
          totalBusiness,
          totalPaid,
          totalPending,
        },
        activityLogs,
      },
      error: null,
    });
  } catch (error: any) {
    res.status(500).json({ error: { message: error.message, code: 'SERVER_ERROR' } });
  }
}

export async function createClient(req: Request, res: Response): Promise<void> {
  try {
    const { name, company, phone, email, address, notes } = req.body;

    if (!name) {
      res.status(400).json({ error: { message: 'Client name is required.', code: 'INVALID_INPUT' } });
      return;
    }

    const client = await prisma.client.create({
      data: { name, company, phone, email, address, notes },
    });

    await prisma.activityLog.create({
      data: {
        entityType: 'CLIENT',
        entityId: client.id,
        action: 'CREATE',
        summary: `Created new client "${client.name}" ${client.company ? `(${client.company})` : ''}`,
      },
    });

    res.status(201).json({ data: client, error: null });
  } catch (error: any) {
    res.status(500).json({ error: { message: error.message, code: 'SERVER_ERROR' } });
  }
}

export async function updateClient(req: Request, res: Response): Promise<void> {
  try {
    const id = req.params.id as string;
    const { name, company, phone, email, address, notes, isActive } = req.body;

    const updated = await prisma.client.update({
      where: { id },
      data: { name, company, phone, email, address, notes, isActive },
    });

    await prisma.activityLog.create({
      data: {
        entityType: 'CLIENT',
        entityId: updated.id,
        action: 'UPDATE',
        summary: `Updated client profile for "${updated.name}"`,
      },
    });

    res.status(200).json({ data: updated, error: null });
  } catch (error: any) {
    res.status(500).json({ error: { message: error.message, code: 'SERVER_ERROR' } });
  }
}

export async function deleteClient(req: Request, res: Response): Promise<void> {
  try {
    const id = req.params.id as string;

    // PRD Section 6.3 Rule: Hard delete is blocked if the client has payments
    const paymentsCount = await prisma.payment.count({
      where: {
        deletedAt: null,
        project: { clientId: id },
      },
    });

    if (paymentsCount > 0) {
      res.status(400).json({
        error: {
          message: 'Cannot delete client with existing payments. You may archive the client instead.',
          code: 'PAYMENTS_EXIST',
        },
      });
      return;
    }

    // If no payments, delete client and associated projects
    await prisma.client.delete({ where: { id } });

    await prisma.activityLog.create({
      data: {
        entityType: 'CLIENT',
        entityId: id,
        action: 'DELETE',
        summary: `Deleted client profile ID ${id}`,
      },
    });

    res.status(200).json({ data: { message: 'Client deleted successfully.' }, error: null });
  } catch (error: any) {
    res.status(500).json({ error: { message: error.message, code: 'SERVER_ERROR' } });
  }
}

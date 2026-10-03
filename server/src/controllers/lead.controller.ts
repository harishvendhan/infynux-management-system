import { Request, Response } from 'express';
import { prisma } from '../prisma';

export async function getLeads(req: Request, res: Response): Promise<void> {
  try {
    const { status, source, search } = req.query;

    const where: any = {};
    if (status && typeof status === 'string') {
      where.status = status;
    }
    if (source && typeof source === 'string') {
      where.source = source;
    }
    if (search && typeof search === 'string') {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { company: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const leads = await prisma.lead.findMany({
      where,
      include: {
        followUps: { orderBy: { dueAt: 'desc' } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({ data: leads, error: null });
  } catch (error: any) {
    res.status(500).json({ error: { message: error.message, code: 'SERVER_ERROR' } });
  }
}

export async function getLeadById(req: Request, res: Response): Promise<void> {
  try {
    const id = req.params.id as string;

    const lead = await prisma.lead.findUnique({
      where: { id },
      include: {
        followUps: { orderBy: { dueAt: 'desc' } },
      },
    });

    if (!lead) {
      res.status(404).json({ error: { message: 'Lead not found.', code: 'NOT_FOUND' } });
      return;
    }

    res.status(200).json({ data: lead, error: null });
  } catch (error: any) {
    res.status(500).json({ error: { message: error.message, code: 'SERVER_ERROR' } });
  }
}

export async function createLead(req: Request, res: Response): Promise<void> {
  try {
    const {
      name,
      company,
      phone,
      email,
      source,
      interestedService,
      estimatedValue,
      status,
      nextFollowUpAt,
      notes,
    } = req.body;

    if (!name) {
      res.status(400).json({ error: { message: 'Lead name is required.', code: 'INVALID_INPUT' } });
      return;
    }

    const lead = await prisma.lead.create({
      data: {
        name,
        company,
        phone,
        email,
        source: source || 'Website',
        interestedService: interestedService || 'WEBSITE',
        estimatedValue: estimatedValue ? Number(estimatedValue) : null,
        status: status || 'NEW',
        nextFollowUpAt: nextFollowUpAt ? new Date(nextFollowUpAt) : null,
        notes,
      },
    });

    // Auto-create calendar event and follow-up entry if nextFollowUpAt is provided
    if (lead.nextFollowUpAt) {
      await prisma.followUp.create({
        data: {
          leadId: lead.id,
          dueAt: lead.nextFollowUpAt,
          note: `Follow-up with ${lead.name}${lead.company ? ` (${lead.company})` : ''}`,
          status: 'PENDING',
        },
      });

      await prisma.event.create({
        data: {
          type: 'FOLLOW_UP',
          title: `CRM Follow-up: ${lead.name}${lead.company ? ` (${lead.company})` : ''}`,
          startAt: lead.nextFollowUpAt,
          allDay: false,
          reminderMinutes: 30,
          status: 'SCHEDULED',
        },
      });
    }

    await prisma.activityLog.create({
      data: {
        entityType: 'LEAD',
        entityId: lead.id,
        action: 'CREATE',
        summary: `New lead added: "${lead.name}" (${lead.company || 'Individual'})`,
      },
    });

    res.status(201).json({ data: lead, error: null });
  } catch (error: any) {
    res.status(500).json({ error: { message: error.message, code: 'SERVER_ERROR' } });
  }
}

export async function updateLead(req: Request, res: Response): Promise<void> {
  try {
    const id = req.params.id as string;
    const {
      name,
      company,
      phone,
      email,
      source,
      interestedService,
      estimatedValue,
      status,
      nextFollowUpAt,
      notes,
    } = req.body;

    const data: any = {};
    if (name !== undefined) data.name = name;
    if (company !== undefined) data.company = company;
    if (phone !== undefined) data.phone = phone;
    if (email !== undefined) data.email = email;
    if (source !== undefined) data.source = source;
    if (interestedService !== undefined) data.interestedService = interestedService;
    if (estimatedValue !== undefined) data.estimatedValue = estimatedValue ? Number(estimatedValue) : null;
    if (status !== undefined) data.status = status;
    if (nextFollowUpAt !== undefined) data.nextFollowUpAt = nextFollowUpAt ? new Date(nextFollowUpAt) : null;
    if (notes !== undefined) data.notes = notes;

    const updated = await prisma.lead.update({
      where: { id },
      data,
    });

    // If next follow-up changed, create calendar event
    if (nextFollowUpAt) {
      await prisma.event.create({
        data: {
          type: 'FOLLOW_UP',
          title: `Follow-up: ${updated.name}${updated.company ? ` (${updated.company})` : ''}`,
          startAt: new Date(nextFollowUpAt),
          allDay: false,
          reminderMinutes: 30,
          status: 'SCHEDULED',
        },
      });
    }

    await prisma.activityLog.create({
      data: {
        entityType: 'LEAD',
        entityId: updated.id,
        action: 'UPDATE',
        summary: `Updated lead "${updated.name}" stage to ${updated.status}`,
      },
    });

    res.status(200).json({ data: updated, error: null });
  } catch (error: any) {
    res.status(500).json({ error: { message: error.message, code: 'SERVER_ERROR' } });
  }
}

export async function convertLeadToClient(req: Request, res: Response): Promise<void> {
  try {
    const id = req.params.id as string;
    const { initialProjectName, totalValue, projectType } = req.body;

    // Use Prisma transaction to ensure atomic lead conversion
    const result = await prisma.$transaction(async (tx) => {
      const lead = await tx.lead.findUnique({ where: { id } });
      if (!lead) {
        throw new Error('Lead not found.');
      }

      // 1. Create client from lead data (no re-typing)
      const client = await tx.client.create({
        data: {
          name: lead.name,
          company: lead.company,
          phone: lead.phone,
          email: lead.email,
          notes: `Converted from lead. ${lead.notes || ''}`,
          convertedFromLeadId: lead.id,
          isActive: true,
        },
      });

      // 2. Link existing follow-ups to new client
      await tx.followUp.updateMany({
        where: { leadId: lead.id },
        data: { clientId: client.id },
      });

      // 3. Set lead status to WON and link converted client ID
      await tx.lead.update({
        where: { id: lead.id },
        data: {
          status: 'WON',
          convertedClientId: client.id,
        },
      });

      // 4. Optionally create initial project if specified
      let project = null;
      if (initialProjectName || totalValue) {
        project = await tx.project.create({
          data: {
            clientId: client.id,
            name: initialProjectName || `${client.name} - Initial Project`,
            projectType: projectType || lead.interestedService || 'WEBSITE',
            totalValue: Number(totalValue || lead.estimatedValue || 0),
            status: 'IN_PROGRESS',
            priority: 'HIGH',
            startDate: new Date(),
          },
        });
      }

      // 5. Log activity
      await tx.activityLog.create({
        data: {
          entityType: 'CLIENT',
          entityId: client.id,
          action: 'CONVERT',
          summary: `Converted lead "${lead.name}" to client. Status marked WON.`,
        },
      });

      return { client, project };
    });

    res.status(200).json({
      data: {
        message: 'Lead converted to client successfully!',
        client: result.client,
        project: result.project,
      },
      error: null,
    });
  } catch (error: any) {
    console.error('Convert lead error:', error);
    res.status(500).json({ error: { message: error.message, code: 'SERVER_ERROR' } });
  }
}

export async function deleteLead(req: Request, res: Response): Promise<void> {
  try {
    const id = req.params.id as string;

    await prisma.lead.delete({ where: { id } });

    await prisma.activityLog.create({
      data: {
        entityType: 'LEAD',
        entityId: id,
        action: 'DELETE',
        summary: `Deleted lead record ID ${id}`,
      },
    });

    res.status(200).json({ data: { message: 'Lead deleted successfully.' }, error: null });
  } catch (error: any) {
    res.status(500).json({ error: { message: error.message, code: 'SERVER_ERROR' } });
  }
}

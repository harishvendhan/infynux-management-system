import { Request, Response } from 'express';
import { prisma } from '../prisma';

export async function getEvents(req: Request, res: Response): Promise<void> {
  try {
    const { from, to, type, status } = req.query;

    const where: any = {};
    if (from || to) {
      where.startAt = {};
      if (from) where.startAt.gte = new Date(from as string);
      if (to) where.startAt.lte = new Date(to as string);
    }
    if (type && typeof type === 'string') {
      where.type = type;
    }
    if (status && typeof status === 'string') {
      where.status = status;
    }

    const events = await prisma.event.findMany({
      where,
      include: {
        client: { select: { id: true, name: true, company: true } },
        project: { select: { id: true, name: true } },
      },
      orderBy: { startAt: 'asc' },
    });

    res.status(200).json({ data: events, error: null });
  } catch (error: any) {
    res.status(500).json({ error: { message: error.message, code: 'SERVER_ERROR' } });
  }
}

export async function createEvent(req: Request, res: Response): Promise<void> {
  try {
    const {
      type,
      title,
      notes,
      clientId,
      projectId,
      startAt,
      endAt,
      allDay,
      reminderMinutes,
      status,
    } = req.body;

    if (!title || !startAt) {
      res.status(400).json({ error: { message: 'Title and start time are required.', code: 'INVALID_INPUT' } });
      return;
    }

    const event = await prisma.event.create({
      data: {
        type: type || 'MEETING',
        title,
        notes,
        clientId: clientId || null,
        projectId: projectId || null,
        startAt: new Date(startAt),
        endAt: endAt ? new Date(endAt) : null,
        allDay: allDay || false,
        reminderMinutes: reminderMinutes !== undefined ? Number(reminderMinutes) : 30,
        status: status || 'SCHEDULED',
      },
      include: {
        client: { select: { name: true } },
        project: { select: { name: true } },
      },
    });

    await prisma.activityLog.create({
      data: {
        entityType: 'EVENT',
        entityId: event.id,
        action: 'CREATE',
        summary: `Created calendar event "${event.title}" (${event.type})`,
      },
    });

    res.status(201).json({ data: event, error: null });
  } catch (error: any) {
    res.status(500).json({ error: { message: error.message, code: 'SERVER_ERROR' } });
  }
}

export async function updateEvent(req: Request, res: Response): Promise<void> {
  try {
    const id = req.params.id as string;
    const {
      type,
      title,
      notes,
      clientId,
      projectId,
      startAt,
      endAt,
      allDay,
      reminderMinutes,
      status,
    } = req.body;

    const data: any = {};
    if (type !== undefined) data.type = type;
    if (title !== undefined) data.title = title;
    if (notes !== undefined) data.notes = notes;
    if (clientId !== undefined) data.clientId = clientId || null;
    if (projectId !== undefined) data.projectId = projectId || null;
    if (startAt !== undefined) data.startAt = new Date(startAt);
    if (endAt !== undefined) data.endAt = endAt ? new Date(endAt) : null;
    if (allDay !== undefined) data.allDay = allDay;
    if (reminderMinutes !== undefined) data.reminderMinutes = Number(reminderMinutes);
    if (status !== undefined) data.status = status;

    const updated = await prisma.event.update({
      where: { id },
      data,
    });

    res.status(200).json({ data: updated, error: null });
  } catch (error: any) {
    res.status(500).json({ error: { message: error.message, code: 'SERVER_ERROR' } });
  }
}

export async function deleteEvent(req: Request, res: Response): Promise<void> {
  try {
    const id = req.params.id as string;

    await prisma.event.delete({ where: { id } });

    res.status(200).json({ data: { message: 'Event deleted successfully.' }, error: null });
  } catch (error: any) {
    res.status(500).json({ error: { message: error.message, code: 'SERVER_ERROR' } });
  }
}

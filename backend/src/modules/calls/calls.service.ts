import { prisma } from '../../services/prisma.js';
import { AppError } from '../../middleware/errorHandler.js';
import { CallDirection, CallStatus, Role } from '../../types/enums.js';
import { getTelephonyProvider } from '../../telephony/telephony.service.js';
import { AuthContext, CallWithRelations, StartCallDTO, CallFilters, PaginatedCalls } from './calls.types.js';
import { normalizePhone } from './calls.validation.js';
import { buildCallVisibilityFilter } from './calls.permissions.js';
import { buildContactVisibilityFilter } from '../contacts/contacts.permissions.js';
import { ContactsService } from '../contacts/contacts.service.js';
import { PresenceService } from '../presence/presence.service.js';

const DEFAULT_CALLER = '+33180001122';
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

const includeRelations = {
  agent: { select: { id: true, firstName: true, lastName: true, email: true } },
  contact: { select: { id: true, firstName: true, lastName: true, phone: true, company: true } },
};

export class CallsService {
  /** Handler enregistré au démarrage du serveur pour les transitions du MockProvider. */
  static async handleProviderStatusChange(callId: string, status: CallStatus): Promise<void> {
    const data: Record<string, unknown> = { status };

    if (status === CallStatus.CONNECTED) {
      data.startedAt = new Date();
    }

    if (status === CallStatus.FAILED) {
      data.endedAt = new Date();
    }

    await prisma.call.update({ where: { id: callId }, data });

    const call = await prisma.call.findUnique({ where: { id: callId }, select: { agentId: true, status: true } });
    if (call && [CallStatus.COMPLETED, CallStatus.FAILED, CallStatus.MISSED].includes(call.status as CallStatus)) {
      await PresenceService.restoreAfterCall(call.agentId);
    }
  }

  static async startCall(auth: AuthContext, data: StartCallDTO): Promise<CallWithRelations> {
    const phone = data.phoneNumber.trim();
    let contactId: string | null = data.contactId || null;

    if (contactId) {
      await ContactsService.assertContactAccessible(contactId, auth);
    } else {
      contactId = await CallsService._findContactByPhone(phone, auth);
    }

    const agent = await prisma.user.findFirst({
      where: { id: auth.userId, workspaceId: auth.workspaceId, isActive: true },
    });
    if (!agent) {
      const err: AppError = new Error('Agent introuvable.');
      err.statusCode = 403;
      throw err;
    }

    const callerNumber = agent.phoneExtension
      ? (agent.phoneExtension.startsWith('+') ? agent.phoneExtension : `+33${agent.phoneExtension}`)
      : DEFAULT_CALLER;

    const call = await prisma.call.create({
      data: {
        callerNumber,
        calledNumber: phone,
        direction: CallDirection.OUTBOUND,
        status: CallStatus.RINGING,
        agentId: auth.userId,
        contactId,
        workspaceId: auth.workspaceId,
        startedAt: new Date(),
      },
      include: includeRelations,
    });

    const provider = getTelephonyProvider();
    try {
      await provider.initiateCall(call.id, callerNumber, phone);
    } catch {
      await prisma.call.update({
        where: { id: call.id },
        data: { status: CallStatus.FAILED, endedAt: new Date() },
      });
      const err: AppError = new Error('Impossible de démarrer l\'appel. Provider indisponible.');
      err.statusCode = 503;
      throw err;
    }

    await PresenceService.markOnCall(auth.userId);

    return call as CallWithRelations;
  }

  static async getAll(auth: AuthContext, filters: CallFilters): Promise<PaginatedCalls> {
    const visibility = await buildCallVisibilityFilter(auth);
    const page = Math.max(1, filters.page || DEFAULT_PAGE);
    const limit = Math.min(Math.max(1, filters.limit || DEFAULT_LIMIT), MAX_LIMIT);
    const skip = (page - 1) * limit;

    const searchWhere = filters.search
      ? {
          OR: [
            { callerNumber: { contains: filters.search } },
            { calledNumber: { contains: filters.search } },
            { contact: { firstName: { contains: filters.search } } },
            { contact: { lastName: { contains: filters.search } } },
            { contact: { phone: { contains: filters.search } } },
          ],
        }
      : {};

    const where = {
      ...visibility,
      ...(filters.direction && { direction: filters.direction }),
      ...(filters.status && { status: filters.status }),
      ...(filters.agentId && { agentId: filters.agentId }),
      ...(filters.contactId && { contactId: filters.contactId }),
      ...searchWhere,
    };

    const [calls, total] = await Promise.all([
      prisma.call.findMany({
        where,
        include: includeRelations,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.call.count({ where }),
    ]);

    return {
      data: calls as CallWithRelations[],
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  static async getById(id: string, auth: AuthContext): Promise<CallWithRelations> {
    const visibility = await buildCallVisibilityFilter(auth);
    const call = await prisma.call.findFirst({
      where: { id, ...visibility },
      include: includeRelations,
    });

    if (!call) {
      const err: AppError = new Error('Appel introuvable.');
      err.statusCode = 404;
      throw err;
    }

    return call as CallWithRelations;
  }

  static async updateStatus(id: string, auth: AuthContext, status: CallStatus): Promise<CallWithRelations> {
    const call = await CallsService._findManageable(id, auth);

    if ([CallStatus.COMPLETED, CallStatus.FAILED, CallStatus.MISSED].includes(call.status as CallStatus)) {
      const err: AppError = new Error('Cet appel est déjà terminé.');
      err.statusCode = 400;
      throw err;
    }

    const data: Record<string, unknown> = { status };
    if (status === CallStatus.CONNECTED && !call.startedAt) {
      data.startedAt = new Date();
    }

    const updated = await prisma.call.update({
      where: { id },
      data,
      include: includeRelations,
    });

    return updated as CallWithRelations;
  }

  static async hangup(id: string, auth: AuthContext): Promise<CallWithRelations> {
    const call = await CallsService._findManageable(id, auth);

    if ([CallStatus.COMPLETED, CallStatus.FAILED, CallStatus.MISSED].includes(call.status as CallStatus)) {
      const err: AppError = new Error('Cet appel est déjà terminé.');
      err.statusCode = 400;
      throw err;
    }

    const provider = getTelephonyProvider();
    await provider.hangupCall(id);

    const endedAt = new Date();
    const duration = call.startedAt
      ? Math.max(0, Math.floor((endedAt.getTime() - call.startedAt.getTime()) / 1000))
      : 0;

    const updated = await prisma.call.update({
      where: { id },
      data: { status: CallStatus.COMPLETED, endedAt, duration },
      include: includeRelations,
    });

    await PresenceService.restoreAfterCall(auth.userId);

    return updated as CallWithRelations;
  }

  static async mute(id: string, auth: AuthContext): Promise<{ muted: boolean }> {
    await CallsService._findManageable(id, auth);
    const provider = getTelephonyProvider();
    await provider.muteCall(id);
    return { muted: true };
  }

  static async unmute(id: string, auth: AuthContext): Promise<{ muted: boolean }> {
    await CallsService._findManageable(id, auth);
    const provider = getTelephonyProvider();
    await provider.unmuteCall(id);
    return { muted: false };
  }

  static async updateNote(id: string, auth: AuthContext, note: string | null): Promise<CallWithRelations> {
    await CallsService._findManageable(id, auth);
    const updated = await prisma.call.update({
      where: { id },
      data: { note: note?.trim() || null },
      include: includeRelations,
    });
    return updated as CallWithRelations;
  }

  // ─── Helpers ───────────────────────────────────────────────────────────────

  private static async _findManageable(id: string, auth: AuthContext) {
    const call = await prisma.call.findFirst({
      where: { id, workspaceId: auth.workspaceId },
    });

    if (!call) {
      const err: AppError = new Error('Appel introuvable.');
      err.statusCode = 404;
      throw err;
    }

    if (auth.role === Role.AGENT && call.agentId !== auth.userId) {
      const err: AppError = new Error('Accès refusé.');
      err.statusCode = 403;
      throw err;
    }

    if (auth.role === Role.MANAGER && call.agentId !== auth.userId) {
      const [manager, agent] = await Promise.all([
        prisma.user.findFirst({ where: { id: auth.userId, workspaceId: auth.workspaceId }, select: { teamId: true } }),
        prisma.user.findFirst({ where: { id: call.agentId, workspaceId: auth.workspaceId }, select: { teamId: true } }),
      ]);
      if (!manager?.teamId || manager.teamId !== agent?.teamId) {
        const err: AppError = new Error('Accès refusé.');
        err.statusCode = 403;
        throw err;
      }
    }

    return call;
  }

  private static async _findContactByPhone(phone: string, auth: AuthContext): Promise<string | null> {
    const normalized = normalizePhone(phone);
    const visibility = await buildContactVisibilityFilter(auth);
    const contacts = await prisma.contact.findMany({
      where: visibility,
      select: { id: true, phone: true },
    });
    const match = contacts.find(c => normalizePhone(c.phone) === normalized || c.phone.includes(normalized) || normalized.includes(normalizePhone(c.phone)));
    return match?.id ?? null;
  }
}

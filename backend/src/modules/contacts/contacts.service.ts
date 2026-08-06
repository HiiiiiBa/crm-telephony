import { prisma } from '../../services/prisma.js';
import { AppError } from '../../middleware/errorHandler.js';
import { buildVisibilityFilter as buildDealVisibilityFilter } from '../deals/deals.permissions.js';
import { buildCallVisibilityFilter } from '../calls/calls.permissions.js';
import {
  assertCanAssignOwner,
  assertCanManageContact,
  buildContactVisibilityFilter,
} from './contacts.permissions.js';
import {
  AuthContext,
  CreateContactDTO,
  UpdateContactDTO,
  ContactFilters,
  PaginatedContacts,
  ContactWithOwner,
  ContactExportPayload,
} from './contacts.types.js';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

const ownerSelect = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
};

export class ContactsService {
  static async getAll(auth: AuthContext, filters: ContactFilters): Promise<PaginatedContacts> {
    const visibility = await buildContactVisibilityFilter(auth);
    const page = Math.max(1, filters.page || DEFAULT_PAGE);
    const limit = Math.min(Math.max(1, filters.limit || DEFAULT_LIMIT), MAX_LIMIT);
    const skip = (page - 1) * limit;

    const searchWhere = filters.search
      ? {
          OR: [
            { firstName: { contains: filters.search } },
            { lastName: { contains: filters.search } },
            { company: { contains: filters.search } },
            { phone: { contains: filters.search } },
            { email: { contains: filters.search } },
          ],
        }
      : {};

    const where = {
      ...visibility,
      ...searchWhere,
    };

    const [contacts, total] = await Promise.all([
      prisma.contact.findMany({
        where,
        include: { owner: { select: ownerSelect } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.contact.count({ where }),
    ]);

    return {
      data: contacts as ContactWithOwner[],
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async getById(id: string, auth: AuthContext): Promise<ContactWithOwner & Record<string, unknown>> {
    const visibility = await buildContactVisibilityFilter(auth);

    const contact = await prisma.contact.findFirst({
      where: { id, ...visibility },
      include: { owner: { select: ownerSelect } },
    });

    if (!contact) {
      const err: AppError = new Error('Contact introuvable.');
      err.statusCode = 404;
      throw err;
    }

    const [dealVisibility, callVisibility, deals, calls, messages] = await Promise.all([
      buildDealVisibilityFilter(auth),
      buildCallVisibilityFilter(auth),
      prisma.deal.findMany({
        where: { contactId: id, ...dealVisibility },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.call.findMany({
        where: { contactId: id, ...callVisibility },
        orderBy: { createdAt: 'desc' },
        include: { agent: { select: ownerSelect } },
      }),
      prisma.message.findMany({
        where: { contactId: id },
        orderBy: { createdAt: 'asc' },
        include: { agent: { select: ownerSelect } },
      }),
    ]);

    return {
      ...(contact as ContactWithOwner),
      deals,
      calls,
      messages,
    };
  }

  static async create(auth: AuthContext, data: CreateContactDTO): Promise<ContactWithOwner> {
    const ownerId = data.ownerId || auth.userId;
    await assertCanAssignOwner(auth, ownerId);
    await ContactsService._validateOwnerBelongsToWorkspace(ownerId, auth.workspaceId);

    const contact = await prisma.contact.create({
      data: {
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        company: data.company?.trim() || null,
        phone: data.phone.trim(),
        email: data.email?.trim().toLowerCase() || null,
        tags: data.tags ? JSON.stringify(data.tags) : null,
        notes: data.notes?.trim() || null,
        ownerId,
        workspaceId: auth.workspaceId,
      },
      include: { owner: { select: ownerSelect } },
    });

    return contact as ContactWithOwner;
  }

  static async update(id: string, auth: AuthContext, data: UpdateContactDTO): Promise<ContactWithOwner> {
    const visibility = await buildContactVisibilityFilter(auth);
    const existing = await prisma.contact.findFirst({ where: { id, ...visibility } });

    if (!existing) {
      const err: AppError = new Error('Contact introuvable.');
      err.statusCode = 404;
      throw err;
    }

    await assertCanManageContact(auth, existing.ownerId);

    if (data.ownerId !== undefined) {
      await assertCanAssignOwner(auth, data.ownerId);
      await ContactsService._validateOwnerBelongsToWorkspace(data.ownerId, auth.workspaceId);
    }

    const contact = await prisma.contact.update({
      where: { id },
      data: {
        ...(data.firstName !== undefined && { firstName: data.firstName.trim() }),
        ...(data.lastName !== undefined && { lastName: data.lastName.trim() }),
        ...(data.company !== undefined && { company: data.company?.trim() || null }),
        ...(data.phone !== undefined && { phone: data.phone.trim() }),
        ...(data.email !== undefined && { email: data.email?.trim().toLowerCase() || null }),
        ...(data.tags !== undefined && { tags: JSON.stringify(data.tags) }),
        ...(data.notes !== undefined && { notes: data.notes?.trim() || null }),
        ...(data.ownerId !== undefined && { ownerId: data.ownerId }),
      },
      include: { owner: { select: ownerSelect } },
    });

    return contact as ContactWithOwner;
  }

  /** NF-05 : export RGPD (droit d'accès aux données personnelles d'un contact). */
  static async exportData(id: string, auth: AuthContext): Promise<ContactExportPayload> {
    const detail = await ContactsService.getById(id, auth);

    const sanitizeAgent = (agent: { id: string; firstName: string; lastName: string; email: string }) => ({
      id: agent.id,
      firstName: agent.firstName,
      lastName: agent.lastName,
      email: agent.email,
    });

    return {
      exportedAt: new Date().toISOString(),
      purpose: 'RGPD — droit d\'accès aux données personnelles',
      contact: {
        id: detail.id,
        firstName: detail.firstName,
        lastName: detail.lastName,
        company: detail.company,
        phone: detail.phone,
        email: detail.email,
        tags: detail.tags,
        notes: detail.notes,
        ownerId: detail.ownerId,
        workspaceId: detail.workspaceId,
        createdAt: detail.createdAt,
        updatedAt: detail.updatedAt,
        owner: detail.owner,
      },
      deals: (detail.deals as Record<string, unknown>[]) || [],
      calls: ((detail.calls as Array<Record<string, unknown> & { agent?: unknown }>) || []).map((call) => ({
        ...call,
        agent: call.agent ? sanitizeAgent(call.agent as any) : undefined,
      })),
      messages: ((detail.messages as Array<Record<string, unknown> & { agent?: unknown }>) || []).map((msg) => ({
        ...msg,
        agent: msg.agent ? sanitizeAgent(msg.agent as any) : undefined,
      })),
    };
  }

  static async delete(id: string, auth: AuthContext): Promise<void> {
    const visibility = await buildContactVisibilityFilter(auth);
    const existing = await prisma.contact.findFirst({ where: { id, ...visibility } });

    if (!existing) {
      const err: AppError = new Error('Contact introuvable.');
      err.statusCode = 404;
      throw err;
    }

    await assertCanManageContact(auth, existing.ownerId);
    await prisma.contact.delete({ where: { id } });
  }

  /** Vérifie qu'un contact est accessible (lecture, appel, SMS, deal). */
  static async assertContactAccessible(contactId: string, auth: AuthContext): Promise<void> {
    const visibility = await buildContactVisibilityFilter(auth);
    const contact = await prisma.contact.findFirst({ where: { id: contactId, ...visibility } });

    if (!contact) {
      const err: AppError = new Error('Contact introuvable ou accès refusé.');
      err.statusCode = 404;
      throw err;
    }
  }

  private static async _validateOwnerBelongsToWorkspace(ownerId: string, workspaceId: string): Promise<void> {
    const owner = await prisma.user.findFirst({ where: { id: ownerId, workspaceId } });
    if (!owner) {
      const err: AppError = new Error('Le propriétaire spécifié n\'appartient pas à cet espace de travail.');
      err.statusCode = 400;
      throw err;
    }
    if (!owner.isActive) {
      const err: AppError = new Error('Le propriétaire spécifié est inactif.');
      err.statusCode = 400;
      throw err;
    }
  }
}

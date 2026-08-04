import { prisma } from '../../services/prisma.js';
import { AppError } from '../../middleware/errorHandler.js';
import { CreateContactDTO, UpdateContactDTO, ContactFilters, PaginatedContacts, ContactWithOwner } from './contacts.types.js';

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
  /**
   * Récupère tous les contacts du workspace avec recherche et pagination.
   */
  static async getAll(workspaceId: string, filters: ContactFilters): Promise<PaginatedContacts> {
    const page = Math.max(1, filters.page || DEFAULT_PAGE);
    const limit = Math.min(Math.max(1, filters.limit || DEFAULT_LIMIT), MAX_LIMIT);
    const skip = (page - 1) * limit;

    // Recherche insensible à la casse sur plusieurs champs
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
      workspaceId,
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

  /**
   * Récupère un contact par son id, en s'assurant qu'il appartient au workspace.
   */
  static async getById(id: string, workspaceId: string): Promise<ContactWithOwner> {
    const contact = await prisma.contact.findFirst({
      where: { id, workspaceId },
      include: {
        owner: { select: ownerSelect },
        deals: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        calls: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: { agent: { select: ownerSelect } },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: { agent: { select: ownerSelect } },
        },
      },
    });

    if (!contact) {
      const err: AppError = new Error('Contact introuvable.');
      err.statusCode = 404;
      throw err;
    }

    return contact as ContactWithOwner;
  }

  /**
   * Crée un nouveau contact dans le workspace.
   */
  static async create(workspaceId: string, data: CreateContactDTO): Promise<ContactWithOwner> {
    // Si un ownerId est fourni, vérifier qu'il appartient au même workspace
    const ownerId = data.ownerId || (await ContactsService._getDefaultOwnerId(workspaceId));

    if (data.ownerId) {
      await ContactsService._validateOwnerBelongsToWorkspace(data.ownerId, workspaceId);
    }

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
        workspaceId,
      },
      include: { owner: { select: ownerSelect } },
    });

    return contact as ContactWithOwner;
  }

  /**
   * Met à jour un contact existant du workspace.
   */
  static async update(id: string, workspaceId: string, data: UpdateContactDTO): Promise<ContactWithOwner> {
    // Vérifier l'existence et l'appartenance au workspace
    const existing = await prisma.contact.findFirst({ where: { id, workspaceId } });
    if (!existing) {
      const err: AppError = new Error('Contact introuvable.');
      err.statusCode = 404;
      throw err;
    }

    // Vérifier le nouvel owner si fourni
    if (data.ownerId) {
      await ContactsService._validateOwnerBelongsToWorkspace(data.ownerId, workspaceId);
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

  /**
   * Supprime un contact du workspace.
   * Stratégie : Les Deals sont supprimés en cascade (schéma Prisma).
   * Les appels et messages voient leur contactId mis à null (SetNull) — l'historique est préservé.
   */
  static async delete(id: string, workspaceId: string): Promise<void> {
    const existing = await prisma.contact.findFirst({ where: { id, workspaceId } });
    if (!existing) {
      const err: AppError = new Error('Contact introuvable.');
      err.statusCode = 404;
      throw err;
    }

    await prisma.contact.delete({ where: { id } });
  }

  // ─── Helpers privés ────────────────────────────────────────────────────────

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

  private static async _getDefaultOwnerId(workspaceId: string): Promise<string> {
    const admin = await prisma.user.findFirst({
      where: { workspaceId, isActive: true },
      orderBy: { createdAt: 'asc' },
    });
    if (!admin) {
      const err: AppError = new Error('Aucun utilisateur trouvé dans ce workspace.');
      err.statusCode = 500;
      throw err;
    }
    return admin.id;
  }
}

import { prisma } from '../../services/prisma.js';
import { AppError } from '../../middleware/errorHandler.js';
import { DealStage } from '../../types/enums.js';
import {
  AuthContext,
  CreateDealDTO,
  UpdateDealDTO,
  DealFilters,
  PaginatedDeals,
  DealWithRelations,
  DealStatsMap,
} from './deals.types.js';
import { buildVisibilityFilter, assertCanManageDeal } from './deals.permissions.js';
import { ContactsService } from '../contacts/contacts.service.js';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

const contactSelect = {
  id: true,
  firstName: true,
  lastName: true,
  company: true,
};

const ownerSelect = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
};

const includeRelations = {
  contact: { select: contactSelect },
  owner: { select: ownerSelect },
};

export class DealsService {
  static async getAll(auth: AuthContext, filters: DealFilters): Promise<PaginatedDeals> {
    const visibility = await buildVisibilityFilter(auth);
    const page = Math.max(1, filters.page || DEFAULT_PAGE);
    const limit = Math.min(Math.max(1, filters.limit || DEFAULT_LIMIT), MAX_LIMIT);
    const skip = (page - 1) * limit;

    const searchWhere = filters.search
      ? { title: { contains: filters.search } }
      : {};

    const where = {
      ...visibility,
      ...(filters.stage && { stage: filters.stage }),
      ...(filters.ownerId && { ownerId: filters.ownerId }),
      ...(filters.contactId && { contactId: filters.contactId }),
      ...searchWhere,
    };

    const [deals, total] = await Promise.all([
      prisma.deal.findMany({
        where,
        include: includeRelations,
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.deal.count({ where }),
    ]);

    return {
      data: deals as DealWithRelations[],
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  static async getById(id: string, auth: AuthContext): Promise<DealWithRelations> {
    const visibility = await buildVisibilityFilter(auth);
    const deal = await prisma.deal.findFirst({
      where: { id, ...visibility },
      include: includeRelations,
    });

    if (!deal) {
      const err: AppError = new Error('Affaire introuvable.');
      err.statusCode = 404;
      throw err;
    }

    return deal as DealWithRelations;
  }

  static async getStats(auth: AuthContext): Promise<DealStatsMap> {
    const visibility = await buildVisibilityFilter(auth);
    const stages = Object.values(DealStage);
    const stats = {} as DealStatsMap;

    await Promise.all(
      stages.map(async (stage) => {
        const where = { ...visibility, stage };
        const [count, agg] = await Promise.all([
          prisma.deal.count({ where }),
          prisma.deal.aggregate({ where, _sum: { value: true } }),
        ]);
        stats[stage] = { count, totalValue: agg._sum.value ?? 0 };
      })
    );

    return stats;
  }

  static async create(auth: AuthContext, data: CreateDealDTO): Promise<DealWithRelations> {
    await ContactsService.assertContactAccessible(data.contactId, auth);

    const ownerId = data.ownerId || auth.userId;
    await DealsService._validateOwner(ownerId, auth.workspaceId);

    const deal = await prisma.deal.create({
      data: {
        title: data.title.trim(),
        value: data.value,
        stage: data.stage || DealStage.LEAD,
        contactId: data.contactId,
        ownerId,
        workspaceId: auth.workspaceId,
      },
      include: includeRelations,
    });

    return deal as DealWithRelations;
  }

  static async update(id: string, auth: AuthContext, data: UpdateDealDTO): Promise<DealWithRelations> {
    const existing = await DealsService._findInWorkspace(id, auth.workspaceId);
    await assertCanManageDeal(auth, existing.ownerId);

    if (data.contactId) {
      await ContactsService.assertContactAccessible(data.contactId, auth);
    }
    if (data.ownerId) {
      await DealsService._validateOwner(data.ownerId, auth.workspaceId);
    }

    const deal = await prisma.deal.update({
      where: { id },
      data: {
        ...(data.title !== undefined && { title: data.title.trim() }),
        ...(data.value !== undefined && { value: data.value }),
        ...(data.stage !== undefined && { stage: data.stage }),
        ...(data.contactId !== undefined && { contactId: data.contactId }),
        ...(data.ownerId !== undefined && { ownerId: data.ownerId }),
      },
      include: includeRelations,
    });

    return deal as DealWithRelations;
  }

  static async updateStage(id: string, auth: AuthContext, stage: DealStage): Promise<DealWithRelations> {
    const existing = await DealsService._findInWorkspace(id, auth.workspaceId);
    await assertCanManageDeal(auth, existing.ownerId);

    const deal = await prisma.deal.update({
      where: { id },
      data: { stage },
      include: includeRelations,
    });

    return deal as DealWithRelations;
  }

  static async delete(id: string, auth: AuthContext): Promise<void> {
    const existing = await DealsService._findInWorkspace(id, auth.workspaceId);
    await assertCanManageDeal(auth, existing.ownerId);
    await prisma.deal.delete({ where: { id } });
  }

  // ─── Helpers privés ────────────────────────────────────────────────────────

  private static async _findInWorkspace(id: string, workspaceId: string) {
    const deal = await prisma.deal.findFirst({ where: { id, workspaceId } });
    if (!deal) {
      const err: AppError = new Error('Affaire introuvable.');
      err.statusCode = 404;
      throw err;
    }
    return deal;
  }

  private static async _validateOwner(ownerId: string, workspaceId: string): Promise<void> {
    const owner = await prisma.user.findFirst({ where: { id: ownerId, workspaceId, isActive: true } });
    if (!owner) {
      const err: AppError = new Error('Le propriétaire spécifié n\'appartient pas à cet espace de travail.');
      err.statusCode = 400;
      throw err;
    }
  }
}

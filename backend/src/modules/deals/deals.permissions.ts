import { prisma } from '../../services/prisma.js';
import { Role } from '../../types/enums.js';
import { AppError } from '../../middleware/errorHandler.js';
import { AuthContext } from './deals.types.js';

/** Filtre Prisma de visibilité selon le rôle (Agent = ses deals, Manager = équipe, Admin = tout le workspace). */
export async function buildVisibilityFilter(auth: AuthContext): Promise<Record<string, unknown>> {
  const base = { workspaceId: auth.workspaceId };

  if (auth.role === Role.ADMIN) {
    return base;
  }

  if (auth.role === Role.MANAGER) {
    const manager = await prisma.user.findFirst({
      where: { id: auth.userId, workspaceId: auth.workspaceId },
      select: { teamId: true },
    });

    if (!manager?.teamId) {
      return { ...base, ownerId: auth.userId };
    }

    const teamMembers = await prisma.user.findMany({
      where: { teamId: manager.teamId, workspaceId: auth.workspaceId, isActive: true },
      select: { id: true },
    });

    return { ...base, ownerId: { in: teamMembers.map((u) => u.id) } };
  }

  // AGENT — uniquement ses propres affaires
  return { ...base, ownerId: auth.userId };
}

/** Vérifie qu'un utilisateur peut modifier/supprimer un deal (ownerId du deal). */
export async function assertCanManageDeal(auth: AuthContext, dealOwnerId: string): Promise<void> {
  if (auth.role === Role.ADMIN) return;

  if (auth.role === Role.AGENT) {
    if (dealOwnerId !== auth.userId) {
      const err: AppError = new Error('Accès refusé. Vous ne pouvez gérer que vos propres affaires.');
      err.statusCode = 403;
      throw err;
    }
    return;
  }

  if (auth.role === Role.MANAGER) {
    if (dealOwnerId === auth.userId) return;

    const [manager, owner] = await Promise.all([
      prisma.user.findFirst({ where: { id: auth.userId, workspaceId: auth.workspaceId }, select: { teamId: true } }),
      prisma.user.findFirst({ where: { id: dealOwnerId, workspaceId: auth.workspaceId }, select: { teamId: true } }),
    ]);

    if (manager?.teamId && owner?.teamId === manager.teamId) return;

    const err: AppError = new Error('Accès refusé. Vous ne pouvez gérer que les affaires de votre équipe.');
    err.statusCode = 403;
    throw err;
  }
}

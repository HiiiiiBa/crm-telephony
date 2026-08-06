import { prisma } from '../../services/prisma.js';
import { Role } from '../../types/enums.js';
import { AppError } from '../../middleware/errorHandler.js';
import { AuthContext } from './contacts.types.js';

/** Filtre Prisma : Agent = ses contacts, Manager = équipe, Admin = tout le workspace. */
export async function buildContactVisibilityFilter(auth: AuthContext): Promise<Record<string, unknown>> {
  const base = { workspaceId: auth.workspaceId };

  if (auth.role === Role.ADMIN) return base;

  if (auth.role === Role.MANAGER) {
    const manager = await prisma.user.findFirst({
      where: { id: auth.userId, workspaceId: auth.workspaceId },
      select: { teamId: true },
    });

    if (!manager?.teamId) return { ...base, ownerId: auth.userId };

    const teamMembers = await prisma.user.findMany({
      where: { teamId: manager.teamId, workspaceId: auth.workspaceId, isActive: true },
      select: { id: true },
    });

    return { ...base, ownerId: { in: teamMembers.map((u) => u.id) } };
  }

  return { ...base, ownerId: auth.userId };
}

export async function assertCanManageContact(auth: AuthContext, contactOwnerId: string): Promise<void> {
  if (auth.role === Role.ADMIN) return;

  if (auth.role === Role.AGENT) {
    if (contactOwnerId !== auth.userId) {
      const err: AppError = new Error('Accès refusé. Vous ne pouvez gérer que vos propres contacts.');
      err.statusCode = 403;
      throw err;
    }
    return;
  }

  if (auth.role === Role.MANAGER) {
    if (contactOwnerId === auth.userId) return;

    const [manager, owner] = await Promise.all([
      prisma.user.findFirst({ where: { id: auth.userId, workspaceId: auth.workspaceId }, select: { teamId: true } }),
      prisma.user.findFirst({ where: { id: contactOwnerId, workspaceId: auth.workspaceId }, select: { teamId: true } }),
    ]);

    if (manager?.teamId && owner?.teamId === manager.teamId) return;

    const err: AppError = new Error('Accès refusé. Vous ne pouvez gérer que les contacts de votre équipe.');
    err.statusCode = 403;
    throw err;
  }
}

/** Vérifie qu'un utilisateur peut assigner un propriétaire (création / réassignation). */
export async function assertCanAssignOwner(auth: AuthContext, targetOwnerId: string): Promise<void> {
  if (targetOwnerId === auth.userId) return;

  if (auth.role === Role.AGENT) {
    const err: AppError = new Error('Vous ne pouvez assigner un contact qu\'à vous-même.');
    err.statusCode = 403;
    throw err;
  }

  if (auth.role === Role.MANAGER) {
    const owner = await prisma.user.findFirst({
      where: { id: targetOwnerId, workspaceId: auth.workspaceId, isActive: true },
      select: { teamId: true },
    });
    if (!owner) {
      const err: AppError = new Error('Propriétaire introuvable.');
      err.statusCode = 400;
      throw err;
    }

    const manager = await prisma.user.findFirst({
      where: { id: auth.userId, workspaceId: auth.workspaceId },
      select: { teamId: true },
    });

    if (manager?.teamId && owner.teamId === manager.teamId) return;

    const err: AppError = new Error('Vous ne pouvez assigner un contact qu\'à un membre de votre équipe.');
    err.statusCode = 403;
    throw err;
  }
}

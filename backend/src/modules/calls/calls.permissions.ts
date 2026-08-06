import { prisma } from '../../services/prisma.js';
import { Role } from '../../types/enums.js';
import { AuthContext } from './calls.types.js';

/** Filtre de visibilité : Agent = ses appels, Manager = équipe, Admin = tout le workspace. */
export async function buildCallVisibilityFilter(auth: AuthContext): Promise<Record<string, unknown>> {
  const base = { workspaceId: auth.workspaceId };

  if (auth.role === Role.ADMIN) return base;

  if (auth.role === Role.MANAGER) {
    const manager = await prisma.user.findFirst({
      where: { id: auth.userId, workspaceId: auth.workspaceId },
      select: { teamId: true },
    });

    if (!manager?.teamId) return { ...base, agentId: auth.userId };

    const teamMembers = await prisma.user.findMany({
      where: { teamId: manager.teamId, workspaceId: auth.workspaceId, isActive: true },
      select: { id: true },
    });

    return { ...base, agentId: { in: teamMembers.map((u) => u.id) } };
  }

  return { ...base, agentId: auth.userId };
}

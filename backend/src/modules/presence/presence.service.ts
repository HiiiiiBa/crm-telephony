import { PresenceStatus, Role } from '../../types/enums.js';
import { AppError } from '../../middleware/errorHandler.js';
import { prisma } from '../../services/prisma.js';

export interface PresenceAuth {
  userId: string;
  workspaceId: string;
  role: string;
}

export interface AgentPresence {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  phoneExtension: string | null;
  teamId: string | null;
  teamName: string | null;
  presenceStatus: PresenceStatus;
  presenceUpdatedAt: Date | null;
  isActive: boolean;
}

export interface PresenceSummary {
  online: number;
  onCall: number;
  onPause: number;
  offline: number;
  total: number;
}

const MANUAL_STATUSES: PresenceStatus[] = [
  PresenceStatus.ONLINE,
  PresenceStatus.PAUSE,
  PresenceStatus.OFFLINE,
];

export class PresenceService {
  /** Connexion → disponible. */
  static async markOnline(userId: string): Promise<void> {
    await PresenceService._update(userId, PresenceStatus.ONLINE);
  }

  /** Déconnexion → hors ligne. */
  static async markOffline(userId: string): Promise<void> {
    await PresenceService._update(userId, PresenceStatus.OFFLINE);
  }

  /** Début d'appel → en communication. */
  static async markOnCall(userId: string): Promise<void> {
    await PresenceService._update(userId, PresenceStatus.ON_CALL);
  }

  /** Fin d'appel → retour disponible si encore ON_CALL. */
  static async restoreAfterCall(userId: string): Promise<void> {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { presenceStatus: true } });
    if (user?.presenceStatus === PresenceStatus.ON_CALL) {
      await PresenceService._update(userId, PresenceStatus.ONLINE);
    }
  }

  /** Changement manuel par l'agent (ONLINE / PAUSE / OFFLINE). */
  static async updateMyPresence(auth: PresenceAuth, status: PresenceStatus): Promise<AgentPresence> {
    if (!MANUAL_STATUSES.includes(status)) {
      const err: AppError = new Error('Statut invalide. Utilisez ONLINE, PAUSE ou OFFLINE.');
      err.statusCode = 400;
      throw err;
    }

    const user = await prisma.user.findFirst({
      where: { id: auth.userId, workspaceId: auth.workspaceId, isActive: true },
    });

    if (!user) {
      const err: AppError = new Error('Utilisateur introuvable.');
      err.statusCode = 404;
      throw err;
    }

    if (user.presenceStatus === PresenceStatus.ON_CALL) {
      const err: AppError = new Error('Impossible de changer de statut pendant un appel.');
      err.statusCode = 409;
      throw err;
    }

    await PresenceService._update(auth.userId, status);
    const list = await PresenceService.getTeamPresence(auth);
    const me = list.find(m => m.id === auth.userId);
    if (!me) {
      const err: AppError = new Error('Utilisateur introuvable.');
      err.statusCode = 404;
      throw err;
    }
    return me;
  }

  static async getTeamPresence(auth: PresenceAuth): Promise<AgentPresence[]> {
    const where = await PresenceService._visibilityWhere(auth);

    const users = await prisma.user.findMany({
      where,
      include: { team: { select: { id: true, name: true } } },
      orderBy: [{ presenceStatus: 'asc' }, { firstName: 'asc' }],
    });

    return users.map(u => ({
      id: u.id,
      firstName: u.firstName,
      lastName: u.lastName,
      email: u.email,
      role: u.role,
      phoneExtension: u.phoneExtension,
      teamId: u.teamId,
      teamName: u.team?.name ?? null,
      presenceStatus: u.presenceStatus as PresenceStatus,
      presenceUpdatedAt: u.presenceUpdatedAt,
      isActive: u.isActive,
    }));
  }

  static async getSummary(auth: PresenceAuth): Promise<PresenceSummary> {
    const members = await PresenceService.getTeamPresence(auth);
    const active = members.filter(m => m.isActive);

    return {
      online: active.filter(m => m.presenceStatus === PresenceStatus.ONLINE).length,
      onCall: active.filter(m => m.presenceStatus === PresenceStatus.ON_CALL).length,
      onPause: active.filter(m => m.presenceStatus === PresenceStatus.PAUSE).length,
      offline: active.filter(m => m.presenceStatus === PresenceStatus.OFFLINE).length,
      total: active.length,
    };
  }

  private static async _visibilityWhere(auth: PresenceAuth): Promise<Record<string, unknown>> {
    const base = { workspaceId: auth.workspaceId, isActive: true };

    if (auth.role === Role.ADMIN) return base;

    if (auth.role === Role.MANAGER) {
      const manager = await prisma.user.findFirst({
        where: { id: auth.userId, workspaceId: auth.workspaceId },
        select: { teamId: true },
      });
      if (!manager?.teamId) return { ...base, id: auth.userId };
      return { ...base, teamId: manager.teamId };
    }

    return { ...base, id: auth.userId };
  }

  private static async _update(userId: string, status: PresenceStatus): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: { presenceStatus: status, presenceUpdatedAt: new Date() },
    });
  }
}

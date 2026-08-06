import bcrypt from 'bcrypt';
import { prisma } from '../../services/prisma.js';
import { Role } from '../../types/enums.js';
import { AppError } from '../../middleware/errorHandler.js';
import { AuthActor, InviteUserDTO, TeamMember, UpdateUserDTO } from './users.types.js';

const toTeamMember = (user: any): TeamMember => {
  const { passwordHash, team, ...rest } = user;
  return {
    ...rest,
    team: team ? { id: team.id, name: team.name } : null,
  };
};

export class UsersService {
  static async list(workspaceId: string): Promise<TeamMember[]> {
    const users = await prisma.user.findMany({
      where: { workspaceId },
      include: { team: { select: { id: true, name: true } } },
      orderBy: [{ role: 'asc' }, { firstName: 'asc' }, { lastName: 'asc' }],
    });
    return users.map(toTeamMember);
  }

  /**
   * Invitation d'un membre dans le workspace (F-04).
   * Tous les comptes créés via invitation sont AGENT par défaut.
   * Un Admin peut attribuer le rôle MANAGER ; un Manager ne peut inviter que des AGENT.
   */
  static async invite(actor: AuthActor, data: InviteUserDTO): Promise<TeamMember> {
    const emailNormalized = data.email.trim().toLowerCase();

    const existingUser = await prisma.user.findUnique({ where: { email: emailNormalized } });
    if (existingUser) {
      const error: AppError = new Error('Un compte existe déjà avec cette adresse email.');
      error.statusCode = 409;
      throw error;
    }

    let assignedRole = Role.AGENT;
    if (data.role === Role.MANAGER && actor.role === Role.ADMIN) {
      assignedRole = Role.MANAGER;
    }

    const passwordHash = await bcrypt.hash(data.password, 10);

    const user = await prisma.user.create({
      data: {
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        email: emailNormalized,
        passwordHash,
        role: assignedRole,
        isActive: true,
        phoneExtension: data.phoneExtension || null,
        workspaceId: actor.workspaceId,
      },
      include: { team: { select: { id: true, name: true } } },
    });

    return toTeamMember(user);
  }

  /**
   * Mise à jour du rôle ou du statut actif (F-05 — réservé à l'Admin).
   */
  static async update(actor: AuthActor, userId: string, data: UpdateUserDTO): Promise<TeamMember> {
    const target = await prisma.user.findFirst({
      where: { id: userId, workspaceId: actor.workspaceId },
      include: { team: { select: { id: true, name: true } } },
    });

    if (!target) {
      const error: AppError = new Error('Utilisateur introuvable dans cet espace de travail.');
      error.statusCode = 404;
      throw error;
    }

    if (target.id === actor.userId && data.isActive === false) {
      const error: AppError = new Error('Vous ne pouvez pas désactiver votre propre compte.');
      error.statusCode = 400;
      throw error;
    }

    if (data.role !== undefined) {
      if (data.role === Role.ADMIN) {
        const error: AppError = new Error('Le rôle ADMIN ne peut pas être attribué via cette action.');
        error.statusCode = 400;
        throw error;
      }

      if (target.role === Role.ADMIN && data.role !== Role.ADMIN) {
        const adminCount = await prisma.user.count({
          where: { workspaceId: actor.workspaceId, role: Role.ADMIN, isActive: true },
        });
        if (adminCount <= 1) {
          const error: AppError = new Error('Impossible de retirer le rôle ADMIN du dernier administrateur actif.');
          error.statusCode = 400;
          throw error;
        }
      }
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.role !== undefined && { role: data.role }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
      include: { team: { select: { id: true, name: true } } },
    });

    return toTeamMember(updated);
  }

  /**
   * Suppression définitive d'un compte (F-05 — réservé à l'Admin).
   */
  static async delete(actor: AuthActor, userId: string): Promise<void> {
    if (userId === actor.userId) {
      const error: AppError = new Error('Vous ne pouvez pas supprimer votre propre compte.');
      error.statusCode = 400;
      throw error;
    }

    const target = await prisma.user.findFirst({
      where: { id: userId, workspaceId: actor.workspaceId },
    });

    if (!target) {
      const error: AppError = new Error('Utilisateur introuvable dans cet espace de travail.');
      error.statusCode = 404;
      throw error;
    }

    if (target.role === Role.ADMIN) {
      const adminCount = await prisma.user.count({
        where: { workspaceId: actor.workspaceId, role: Role.ADMIN },
      });
      if (adminCount <= 1) {
        const error: AppError = new Error('Impossible de supprimer le dernier administrateur du workspace.');
        error.statusCode = 400;
        throw error;
      }
    }

    await prisma.user.delete({ where: { id: userId } });
  }
}

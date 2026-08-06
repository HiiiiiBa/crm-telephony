import { prisma } from '../../services/prisma.js';
import { AppError } from '../../middleware/errorHandler.js';
import { AuthActor, CreateTeamDTO, TeamSummary } from './teams.types.js';

export class TeamsService {
  static async list(workspaceId: string): Promise<TeamSummary[]> {
    const teams = await prisma.team.findMany({
      where: { workspaceId },
      include: { _count: { select: { users: true } } },
      orderBy: { name: 'asc' },
    });

    return teams.map(t => ({
      id: t.id,
      name: t.name,
      description: t.description,
      memberCount: t._count.users,
    }));
  }

  static async create(actor: AuthActor, data: CreateTeamDTO): Promise<TeamSummary> {
    const team = await prisma.team.create({
      data: {
        name: data.name.trim(),
        description: data.description?.trim() || null,
        workspaceId: actor.workspaceId,
      },
      include: { _count: { select: { users: true } } },
    });

    return {
      id: team.id,
      name: team.name,
      description: team.description,
      memberCount: team._count.users,
    };
  }

  static async assertTeamInWorkspace(teamId: string, workspaceId: string): Promise<void> {
    const team = await prisma.team.findFirst({ where: { id: teamId, workspaceId } });
    if (!team) {
      const err: AppError = new Error('Équipe introuvable dans cet espace de travail.');
      err.statusCode = 400;
      throw err;
    }
  }
}

import { Request, Response, NextFunction } from 'express';
import { TeamsService } from './teams.service.js';

export class TeamsController {
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const { workspaceId } = req.user!;
      const teams = await TeamsService.list(workspaceId);
      return res.status(200).json({ success: true, data: teams });
    } catch (err) {
      next(err);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const actor = req.user!;
      const { name, description } = req.body;

      if (!name || typeof name !== 'string' || !name.trim()) {
        return res.status(400).json({
          success: false,
          error: { message: 'Le nom de l\'équipe est obligatoire.' },
        });
      }

      const team = await TeamsService.create(
        { userId: actor.userId, workspaceId: actor.workspaceId, role: actor.role },
        { name, description }
      );

      return res.status(201).json({ success: true, data: team });
    } catch (err) {
      next(err);
    }
  }
}

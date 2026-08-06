import { Request, Response, NextFunction } from 'express';
import { UsersService } from './users.service.js';
import { validateInviteUser, validateUpdateUser } from './users.validation.js';

export class UsersController {
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const { workspaceId } = req.user!;
      const users = await UsersService.list(workspaceId);
      return res.status(200).json({ success: true, data: users });
    } catch (err) {
      next(err);
    }
  }

  static async invite(req: Request, res: Response, next: NextFunction) {
    try {
      const actor = req.user!;
      const validation = validateInviteUser(req.body);
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          error: { message: 'Données d\'invitation invalides.', details: validation.errors },
        });
      }

      const user = await UsersService.invite(
        { userId: actor.userId, workspaceId: actor.workspaceId, role: actor.role },
        req.body
      );

      return res.status(201).json({ success: true, data: user });
    } catch (err) {
      next(err);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const actor = req.user!;
      const validation = validateUpdateUser(req.body);
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          error: { message: 'Données de mise à jour invalides.', details: validation.errors },
        });
      }

      const user = await UsersService.update(
        { userId: actor.userId, workspaceId: actor.workspaceId, role: actor.role },
        req.params.id,
        req.body
      );

      return res.status(200).json({ success: true, data: user });
    } catch (err) {
      next(err);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const actor = req.user!;
      await UsersService.delete(
        { userId: actor.userId, workspaceId: actor.workspaceId, role: actor.role },
        req.params.id
      );
      return res.status(204).send();
    } catch (err) {
      next(err);
    }
  }
}

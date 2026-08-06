import { Request, Response, NextFunction } from 'express';
import { PresenceStatus } from '../../types/enums.js';
import { PresenceService } from './presence.service.js';

const authFromReq = (req: Request) => {
  const { userId, workspaceId, role } = req.user!;
  return { userId, workspaceId, role };
};

export class PresenceController {
  static async getTeam(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await PresenceService.getTeamPresence(authFromReq(req));
      return res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  static async getSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await PresenceService.getSummary(authFromReq(req));
      return res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  static async updateMe(req: Request, res: Response, next: NextFunction) {
    try {
      const { status } = req.body;
      if (!status || !Object.values(PresenceStatus).includes(status)) {
        return res.status(400).json({
          success: false,
          error: { message: 'Statut requis : ONLINE, PAUSE ou OFFLINE.' },
        });
      }

      const data = await PresenceService.updateMyPresence(authFromReq(req), status as PresenceStatus);
      return res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  static async goOffline(req: Request, res: Response, next: NextFunction) {
    try {
      await PresenceService.markOffline(req.user!.userId);
      return res.status(204).send();
    } catch (err) {
      next(err);
    }
  }
}

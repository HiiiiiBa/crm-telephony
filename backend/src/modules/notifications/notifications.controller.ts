import { Request, Response, NextFunction } from 'express';
import { NotificationsService } from './notifications.service.js';

export class NotificationsController {
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId, workspaceId } = req.user!;
      const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : undefined;
      const result = await NotificationsService.list(userId, workspaceId, limit);
      return res.status(200).json({ success: true, ...result, data: result.items });
    } catch (err) {
      next(err);
    }
  }

  static async markRead(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId, workspaceId } = req.user!;
      const item = await NotificationsService.markRead(userId, workspaceId, req.params.id);
      return res.status(200).json({ success: true, data: item });
    } catch (err) {
      next(err);
    }
  }

  static async markAllRead(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId, workspaceId } = req.user!;
      const count = await NotificationsService.markAllRead(userId, workspaceId);
      return res.status(200).json({ success: true, data: { count } });
    } catch (err) {
      next(err);
    }
  }
}

import { Request, Response, NextFunction } from 'express';
import { DashboardService } from './dashboard.service.js';

export class DashboardController {
  static async getDashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const auth = req.user!;
      const days = req.query.days ? parseInt(String(req.query.days), 10) : undefined;
      const direction = req.query.direction ? String(req.query.direction) : undefined;

      const data = await DashboardService.getDashboard(
        { userId: auth.userId, workspaceId: auth.workspaceId, role: auth.role },
        days,
        direction,
      );

      return res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  static async exportCsv(req: Request, res: Response, next: NextFunction) {
    try {
      const auth = req.user!;
      const days = req.query.days ? parseInt(String(req.query.days), 10) : undefined;
      const direction = req.query.direction ? String(req.query.direction) : undefined;

      const csv = await DashboardService.exportCsv(
        { userId: auth.userId, workspaceId: auth.workspaceId, role: auth.role },
        days,
        direction,
      );

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="dashboard-export.csv"');
      return res.status(200).send('\uFEFF' + csv);
    } catch (err) {
      next(err);
    }
  }
}

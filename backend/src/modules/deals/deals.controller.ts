import { Request, Response, NextFunction } from 'express';
import { DealsService } from './deals.service.js';
import { DealStage } from '../../types/enums.js';
import { validateCreateDeal, validateUpdateDeal, validateUpdateDealStage } from './deals.validation.js';

export class DealsController {
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId, workspaceId, role } = req.user!;
      const { search, stage, ownerId, contactId, page, limit } = req.query;

      const result = await DealsService.getAll(
        { userId, workspaceId, role },
        {
          search: search ? String(search) : undefined,
          stage: stage ? (String(stage) as DealStage) : undefined,
          ownerId: ownerId ? String(ownerId) : undefined,
          contactId: contactId ? String(contactId) : undefined,
          page: page ? parseInt(String(page), 10) : undefined,
          limit: limit ? parseInt(String(limit), 10) : undefined,
        }
      );

      return res.status(200).json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  static async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId, workspaceId, role } = req.user!;
      const stats = await DealsService.getStats({ userId, workspaceId, role });
      return res.status(200).json({ success: true, data: stats });
    } catch (err) {
      next(err);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId, workspaceId, role } = req.user!;
      const deal = await DealsService.getById(req.params.id, { userId, workspaceId, role });
      return res.status(200).json({ success: true, data: deal });
    } catch (err) {
      next(err);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId, workspaceId, role } = req.user!;

      const validation = validateCreateDeal(req.body);
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          error: { message: 'Données invalides.', details: validation.errors },
        });
      }

      const data = { ...req.body, ownerId: req.body.ownerId || userId };
      const deal = await DealsService.create({ userId, workspaceId, role }, data);
      return res.status(201).json({ success: true, data: deal });
    } catch (err) {
      next(err);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId, workspaceId, role } = req.user!;

      const validation = validateUpdateDeal(req.body);
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          error: { message: 'Données invalides.', details: validation.errors },
        });
      }

      const deal = await DealsService.update(req.params.id, { userId, workspaceId, role }, req.body);
      return res.status(200).json({ success: true, data: deal });
    } catch (err) {
      next(err);
    }
  }

  static async updateStage(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId, workspaceId, role } = req.user!;

      const validation = validateUpdateDealStage(req.body);
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          error: { message: 'Données invalides.', details: validation.errors },
        });
      }

      const deal = await DealsService.updateStage(
        req.params.id,
        { userId, workspaceId, role },
        req.body.stage
      );
      return res.status(200).json({ success: true, data: deal });
    } catch (err) {
      next(err);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId, workspaceId, role } = req.user!;
      await DealsService.delete(req.params.id, { userId, workspaceId, role });
      return res.status(204).send();
    } catch (err) {
      next(err);
    }
  }
}

import { Request, Response, NextFunction } from 'express';
import { ContactsService } from './contacts.service.js';
import { validateCreateContact, validateUpdateContact } from './contacts.validation.js';

export class ContactsController {
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { workspaceId } = req.user!;
      const { search, page, limit } = req.query;

      const result = await ContactsService.getAll(workspaceId, {
        search: search ? String(search) : undefined,
        page: page ? parseInt(String(page), 10) : undefined,
        limit: limit ? parseInt(String(limit), 10) : undefined,
      });

      return res.status(200).json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { workspaceId } = req.user!;
      const contact = await ContactsService.getById(req.params.id, workspaceId);
      return res.status(200).json({ success: true, data: contact });
    } catch (err) {
      next(err);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { workspaceId, userId } = req.user!;

      const validation = validateCreateContact(req.body);
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          error: { message: 'Données invalides.', details: validation.errors },
        });
      }

      // L'ownerId par défaut est l'utilisateur connecté si non fourni
      const data = {
        ...req.body,
        ownerId: req.body.ownerId || userId,
      };

      const contact = await ContactsService.create(workspaceId, data);
      return res.status(201).json({ success: true, data: contact });
    } catch (err) {
      next(err);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { workspaceId } = req.user!;

      const validation = validateUpdateContact(req.body);
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          error: { message: 'Données invalides.', details: validation.errors },
        });
      }

      const contact = await ContactsService.update(req.params.id, workspaceId, req.body);
      return res.status(200).json({ success: true, data: contact });
    } catch (err) {
      next(err);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { workspaceId } = req.user!;
      await ContactsService.delete(req.params.id, workspaceId);
      return res.status(204).send();
    } catch (err) {
      next(err);
    }
  }
}

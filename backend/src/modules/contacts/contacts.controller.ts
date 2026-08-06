import { Request, Response, NextFunction } from 'express';
import { ContactsService } from './contacts.service.js';
import { validateCreateContact, validateUpdateContact } from './contacts.validation.js';

const authFromReq = (req: Request) => {
  const { userId, workspaceId, role } = req.user!;
  return { userId, workspaceId, role };
};

export class ContactsController {
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { search, page, limit } = req.query;

      const result = await ContactsService.getAll(authFromReq(req), {
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
      const contact = await ContactsService.getById(req.params.id, authFromReq(req));
      return res.status(200).json({ success: true, data: contact });
    } catch (err) {
      next(err);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const auth = authFromReq(req);

      const validation = validateCreateContact(req.body);
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          error: { message: 'Données invalides.', details: validation.errors },
        });
      }

      const data = {
        ...req.body,
        ownerId: req.body.ownerId || auth.userId,
      };

      const contact = await ContactsService.create(auth, data);
      return res.status(201).json({ success: true, data: contact });
    } catch (err) {
      next(err);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const validation = validateUpdateContact(req.body);
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          error: { message: 'Données invalides.', details: validation.errors },
        });
      }

      const contact = await ContactsService.update(req.params.id, authFromReq(req), req.body);
      return res.status(200).json({ success: true, data: contact });
    } catch (err) {
      next(err);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await ContactsService.delete(req.params.id, authFromReq(req));
      return res.status(204).send();
    } catch (err) {
      next(err);
    }
  }
}

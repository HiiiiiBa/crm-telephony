import { Request, Response, NextFunction } from 'express';
import { CallsService } from './calls.service.js';
import { CallStatus, CallDirection } from '../../types/enums.js';
import { validateStartCall, validateUpdateCallStatus, validateUpdateCallNote } from './calls.validation.js';

export class CallsController {
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId, workspaceId, role } = req.user!;
      const { search, direction, status, agentId, contactId, page, limit } = req.query;

      const result = await CallsService.getAll(
        { userId, workspaceId, role },
        {
          search: search ? String(search) : undefined,
          direction: direction ? (String(direction) as CallDirection) : undefined,
          status: status ? (String(status) as CallStatus) : undefined,
          agentId: agentId ? String(agentId) : undefined,
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

  static async startCall(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId, workspaceId, role } = req.user!;

      const validation = validateStartCall(req.body);
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          error: { message: 'Données invalides.', details: validation.errors },
        });
      }

      const call = await CallsService.startCall(
        { userId, workspaceId, role },
        { phoneNumber: req.body.phoneNumber, contactId: req.body.contactId }
      );

      return res.status(201).json({ success: true, data: call });
    } catch (err) {
      next(err);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId, workspaceId, role } = req.user!;
      const call = await CallsService.getById(req.params.id, { userId, workspaceId, role });
      return res.status(200).json({ success: true, data: call });
    } catch (err) {
      next(err);
    }
  }

  static async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId, workspaceId, role } = req.user!;

      const validation = validateUpdateCallStatus(req.body);
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          error: { message: 'Données invalides.', details: validation.errors },
        });
      }

      const call = await CallsService.updateStatus(
        req.params.id,
        { userId, workspaceId, role },
        req.body.status as CallStatus
      );

      return res.status(200).json({ success: true, data: call });
    } catch (err) {
      next(err);
    }
  }

  static async hangup(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId, workspaceId, role } = req.user!;
      const call = await CallsService.hangup(req.params.id, { userId, workspaceId, role });
      return res.status(200).json({ success: true, data: call });
    } catch (err) {
      next(err);
    }
  }

  static async mute(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId, workspaceId, role } = req.user!;
      const result = await CallsService.mute(req.params.id, { userId, workspaceId, role });
      return res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  static async unmute(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId, workspaceId, role } = req.user!;
      const result = await CallsService.unmute(req.params.id, { userId, workspaceId, role });
      return res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  static async updateNote(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId, workspaceId, role } = req.user!;

      const validation = validateUpdateCallNote(req.body);
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          error: { message: 'Données invalides.', details: validation.errors },
        });
      }

      const call = await CallsService.updateNote(
        req.params.id,
        { userId, workspaceId, role },
        req.body.note ?? null
      );

      return res.status(200).json({ success: true, data: call });
    } catch (err) {
      next(err);
    }
  }
}

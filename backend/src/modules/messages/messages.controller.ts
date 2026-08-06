import { Request, Response, NextFunction } from 'express';
import { MessagesService } from './messages.service.js';
import { validateSendMessage } from './messages.validation.js';

export class MessagesController {
  static async send(req: Request, res: Response, next: NextFunction) {
    try {
      const auth = req.user!;
      const validation = validateSendMessage(req.body);
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          error: { message: 'Données invalides.', details: validation.errors },
        });
      }

      const message = await MessagesService.send(
        { userId: auth.userId, workspaceId: auth.workspaceId, role: auth.role },
        req.body
      );

      return res.status(201).json({ success: true, data: message });
    } catch (err) {
      next(err);
    }
  }

  static async listConversations(req: Request, res: Response, next: NextFunction) {
    try {
      const auth = req.user!;
      const conversations = await MessagesService.listConversations({
        userId: auth.userId,
        workspaceId: auth.workspaceId,
        role: auth.role,
      });

      return res.status(200).json({ success: true, data: conversations });
    } catch (err) {
      next(err);
    }
  }

  static async listByContact(req: Request, res: Response, next: NextFunction) {
    try {
      const auth = req.user!;
      const { contactId } = req.query;

      if (!contactId || typeof contactId !== 'string') {
        return res.status(400).json({
          success: false,
          error: { message: 'Le paramètre contactId est obligatoire.' },
        });
      }

      const messages = await MessagesService.listByContact(
        { userId: auth.userId, workspaceId: auth.workspaceId, role: auth.role },
        contactId
      );

      return res.status(200).json({ success: true, data: messages });
    } catch (err) {
      next(err);
    }
  }

  /** Webhook opérateur SMS (Twilio Messaging, etc.) — sans JWT. */
  static async inboundWebhook(req: Request, res: Response, next: NextFunction) {
    try {
      const workspaceId = req.query.workspaceId;

      if (!workspaceId || typeof workspaceId !== 'string') {
        return res.status(400).json({
          success: false,
          error: { message: 'Le paramètre workspaceId est obligatoire.' },
        });
      }

      const message = await MessagesService.handleProviderWebhook(workspaceId, req.body);

      return res.status(201).json({ success: true, data: message });
    } catch (err) {
      next(err);
    }
  }
}

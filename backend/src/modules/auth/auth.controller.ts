import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service.js';
import { validateRegister, validateLogin } from './auth.validation.js';

export class AuthController {
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const validation = validateRegister(req.body);
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          error: { message: 'Données d\'inscription invalides.', details: validation.errors },
        });
      }

      const result = await AuthService.register(req.body);

      return res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const validation = validateLogin(req.body);
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          error: { message: 'Données de connexion invalides.', details: validation.errors },
        });
      }

      const result = await AuthService.login(req.body);

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getMe(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: { message: 'Utilisateur non authentifié.' },
        });
      }

      const user = await AuthService.getMe(req.user.userId);

      return res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }
}

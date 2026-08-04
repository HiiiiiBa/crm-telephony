import { Request, Response, NextFunction } from 'express';

export const requireRole = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: { message: 'Utilisateur non authentifié.' },
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: {
          message: `Accès refusé. Rôle '${req.user.role}' non autorisé pour cette action. Rôles requis: [${allowedRoles.join(', ')}]`,
        },
      });
    }

    next();
  };
};

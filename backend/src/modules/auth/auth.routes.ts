import { Router } from 'express';
import { AuthController } from './auth.controller.js';
import { authenticateJWT } from '../../middleware/auth.middleware.js';

const router = Router();

// Route d'inscription : POST /api/auth/register
router.post('/register', AuthController.register);

// Statut setup (inscription publique autorisée ?)
router.get('/setup-status', AuthController.getSetupStatus);

// Route de connexion : POST /api/auth/login
router.post('/login', AuthController.login);

// Route profil utilisateur connecté : GET /api/auth/me (Protégée)
router.get('/me', authenticateJWT, AuthController.getMe);

// Membres du workspace (pour assignation propriétaire contact)
router.get('/members', authenticateJWT, AuthController.getWorkspaceMembers);

export default router;

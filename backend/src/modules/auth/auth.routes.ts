import { Router } from 'express';
import { AuthController } from './auth.controller.js';
import { authenticateJWT } from '../../middleware/auth.middleware.js';

const router = Router();

// Route d'inscription : POST /api/auth/register
router.post('/register', AuthController.register);

// Route de connexion : POST /api/auth/login
router.post('/login', AuthController.login);

// Route profil utilisateur connecté : GET /api/auth/me (Protégée)
router.get('/me', authenticateJWT, AuthController.getMe);

export default router;

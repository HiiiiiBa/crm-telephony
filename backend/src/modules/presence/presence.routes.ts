import { Router } from 'express';
import { authenticateJWT } from '../../middleware/auth.middleware.js';
import { PresenceController } from './presence.controller.js';

const router = Router();

router.use(authenticateJWT);
router.get('/team', PresenceController.getTeam);
router.get('/summary', PresenceController.getSummary);
router.patch('/me', PresenceController.updateMe);
router.post('/offline', PresenceController.goOffline);

export default router;

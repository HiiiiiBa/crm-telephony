import { Router } from 'express';
import { authenticateJWT } from '../../middleware/auth.middleware.js';
import { NotificationsController } from './notifications.controller.js';

const router = Router();

router.use(authenticateJWT);
router.get('/', NotificationsController.list);
router.post('/read-all', NotificationsController.markAllRead);
router.patch('/:id/read', NotificationsController.markRead);

export default router;

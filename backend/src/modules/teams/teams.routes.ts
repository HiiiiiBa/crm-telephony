import { Router } from 'express';
import { authenticateJWT } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/role.middleware.js';
import { Role } from '../../types/enums.js';
import { TeamsController } from './teams.controller.js';

const router = Router();

router.use(authenticateJWT);

router.get('/', TeamsController.list);
router.post('/', requireRole(Role.ADMIN, Role.MANAGER), TeamsController.create);

export default router;

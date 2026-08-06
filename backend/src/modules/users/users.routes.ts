import { Router } from 'express';
import { authenticateJWT } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/role.middleware.js';
import { Role } from '../../types/enums.js';
import { UsersController } from './users.controller.js';

const router = Router();

router.use(authenticateJWT);

router.get('/', requireRole(Role.ADMIN, Role.MANAGER), UsersController.list);
router.post('/invite', requireRole(Role.ADMIN, Role.MANAGER), UsersController.invite);
router.patch('/:id', requireRole(Role.ADMIN), UsersController.update);
router.delete('/:id', requireRole(Role.ADMIN), UsersController.delete);

export default router;

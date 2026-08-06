import { Router } from 'express';
import { DealsController } from './deals.controller.js';
import { authenticateJWT } from '../../middleware/auth.middleware.js';

const router = Router();

router.use(authenticateJWT);

router.get('/stats', DealsController.getStats);
router.get('/', DealsController.getAll);
router.get('/:id', DealsController.getById);
router.post('/', DealsController.create);
router.put('/:id', DealsController.update);
router.patch('/:id/stage', DealsController.updateStage);
router.delete('/:id', DealsController.delete);

export default router;

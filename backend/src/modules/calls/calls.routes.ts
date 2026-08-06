import { Router } from 'express';
import { CallsController } from './calls.controller.js';
import { authenticateJWT } from '../../middleware/auth.middleware.js';

const router = Router();

router.use(authenticateJWT);

router.get('/', CallsController.getAll);
router.post('/', CallsController.startCall);
router.get('/:id', CallsController.getById);
router.patch('/:id/note', CallsController.updateNote);
router.patch('/:id/status', CallsController.updateStatus);
router.post('/:id/hangup', CallsController.hangup);
router.post('/:id/mute', CallsController.mute);
router.post('/:id/unmute', CallsController.unmute);

export default router;

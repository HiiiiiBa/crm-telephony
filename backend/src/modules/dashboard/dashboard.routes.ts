import { Router } from 'express';
import { authenticateJWT } from '../../middleware/auth.middleware.js';
import { DashboardController } from './dashboard.controller.js';

const router = Router();

router.use(authenticateJWT);
router.get('/export', DashboardController.exportCsv);
router.get('/', DashboardController.getDashboard);

export default router;

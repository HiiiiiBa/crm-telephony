import { Router } from 'express';
import { ContactsController } from './contacts.controller.js';
import { authenticateJWT } from '../../middleware/auth.middleware.js';

const router = Router();

// Toutes les routes contacts sont protégées par JWT
router.use(authenticateJWT);

router.get('/', ContactsController.getAll);
router.get('/:id/export', ContactsController.exportData);
router.get('/:id', ContactsController.getById);
router.post('/', ContactsController.create);
router.put('/:id', ContactsController.update);
router.delete('/:id', ContactsController.delete);

export default router;

import { Router } from 'express';
import { authenticateJWT } from '../../middleware/auth.middleware.js';
import { MessagesController } from './messages.controller.js';

const router = Router();

// Point d'intégration webhook SMS entrant (F-52) — public, identifié par workspaceId
router.post('/webhook/inbound', MessagesController.inboundWebhook);

router.use(authenticateJWT);

router.get('/conversations', MessagesController.listConversations);
router.get('/', MessagesController.listByContact);
router.post('/', MessagesController.send);

export default router;

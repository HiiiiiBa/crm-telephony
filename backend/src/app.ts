import express from 'express';
import cors from 'cors';
import authRoutes from './modules/auth/auth.routes.js';
import contactsRoutes from './modules/contacts/contacts.routes.js';
import dealsRoutes from './modules/deals/deals.routes.js';
import callsRoutes from './modules/calls/calls.routes.js';
import usersRoutes from './modules/users/users.routes.js';
import messagesRoutes from './modules/messages/messages.routes.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

// Middlewares globaux
app.use(cors());
app.use(express.json());

// Endpoint de santé (Health Check)
app.get('/api/health', (_req, res) => {
  res.status(200).json({
    status: 'online',
    service: 'CRM Cloud & Telephony API',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// Modules
app.use('/api/auth', authRoutes);
app.use('/api/contacts', contactsRoutes);
app.use('/api/deals', dealsRoutes);
app.use('/api/calls', callsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/messages', messagesRoutes);

// Middleware d'erreur global
app.use(errorHandler);

export default app;

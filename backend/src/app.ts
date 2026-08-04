import express from 'express';
import cors from 'cors';
import authRoutes from './modules/auth/auth.routes.js';
import contactsRoutes from './modules/contacts/contacts.routes.js';
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

// Middleware d'erreur global
app.use(errorHandler);

export default app;

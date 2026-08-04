import app from './app.js';
import { env } from './config/env.js';

const PORT = parseInt(env.PORT, 10) || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Serveur backend CRM Téléphonie démarré sur http://localhost:${PORT}`);
  console.log(`📡 Point de santé : http://localhost:${PORT}/api/health`);
});

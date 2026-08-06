import './setup.js';
import http from 'http';
import app from '../app.js';
import { prisma } from '../services/prisma.js';
import { AuthService } from '../modules/auth/auth.service.js';
import { initTelephonyProvider } from '../telephony/telephony.service.js';
import { CallsService } from '../modules/calls/calls.service.js';

type ApiJson = Record<string, any>;

const API = (port: number, path: string, options: RequestInit = {}) =>
  fetch(`http://127.0.0.1:${port}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers as Record<string, string>) },
  });

async function runTests() {
  console.log('🧪 Tests API HTTP Calls...\n');
  initTelephonyProvider(CallsService.handleProviderStatusChange.bind(CallsService));

  let passed = 0;
  let failed = 0;
  const assert = (c: boolean, n: string) => { if (c) { console.log(`  ✅ [PASS] ${n}`); passed++; } else { console.error(`  ❌ [FAIL] ${n}`); failed++; } };

  const server = http.createServer(app);
  await new Promise<void>(r => server.listen(0, r));
  const port = (server.address() as { port: number }).port;

  const reg = await AuthService.register({
    firstName: 'Api', lastName: 'Calls', email: 'api.calls.test@crm.local', password: 'Password123!',
  });
  const token = reg.token;
  const ws = reg.user.workspaceId;
  const auth = { Authorization: `Bearer ${token}` };

  try {
    assert((await API(port, '/api/calls', { method: 'POST', body: JSON.stringify({ phoneNumber: '+33611111111' }) })).status === 401, '401 sans token');

    const listUnauth = await API(port, '/api/calls');
    assert(listUnauth.status === 401, 'GET /api/calls sans token → 401');

    const list = await API(port, '/api/calls?page=1&limit=10', { headers: auth });
    const listBody = await list.json() as ApiJson;
    assert(list.status === 200 && Array.isArray(listBody.data), 'GET /api/calls → 200');

    const invalid = await API(port, '/api/calls', { method: 'POST', headers: auth, body: JSON.stringify({ phoneNumber: 'x' }) });
    assert(invalid.status === 400, '400 numéro invalide');

    const start = await API(port, '/api/calls', { method: 'POST', headers: auth, body: JSON.stringify({ phoneNumber: '+33655555555' }) });
    const startBody = await start.json() as ApiJson;
    assert(start.status === 201, '201 création appel');
    const callId = startBody.data?.id;

    const get = await API(port, `/api/calls/${callId}`, { headers: auth });
    assert(get.status === 200, 'GET appel OK');

    const note = await API(port, `/api/calls/${callId}/note`, {
      method: 'PATCH', headers: auth, body: JSON.stringify({ note: 'Note API test' }),
    });
    assert(note.status === 200, 'PATCH note OK');

    const hangup = await API(port, `/api/calls/${callId}/hangup`, { method: 'POST', headers: auth });
    assert(hangup.status === 200, 'Hangup OK');

    console.log(`\n📊 Résultats API : ${passed} réussis, ${failed} échoués.`);
    if (failed > 0) process.exit(1);
  } finally {
    server.close();
    await prisma.call.deleteMany({ where: { workspaceId: ws } });
    await prisma.user.deleteMany({ where: { email: 'api.calls.test@crm.local' } });
    await prisma.workspace.deleteMany({ where: { id: ws } });
    await prisma.$disconnect();
  }
}

runTests().catch(e => { console.error(e); process.exit(1); });

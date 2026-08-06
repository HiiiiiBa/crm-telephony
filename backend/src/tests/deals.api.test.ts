import './setup.js';
import http from 'http';
import app from '../app.js';
import { prisma } from '../services/prisma.js';
import { AuthService } from '../modules/auth/auth.service.js';
import { ContactsService } from '../modules/contacts/contacts.service.js';
import { DealStage, Role } from '../types/enums.js';

type ApiJson = Record<string, any>;

const API = (port: number, path: string, options: RequestInit = {}) =>
  fetch(`http://127.0.0.1:${port}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers as Record<string, string>) },
  });

async function runTests() {
  console.log('🧪 Démarrage des tests API HTTP du module Deals...\n');
  let passed = 0;
  let failed = 0;

  const assert = (condition: boolean, name: string) => {
    if (condition) { console.log(`  ✅ [PASS] ${name}`); passed++; }
    else { console.error(`  ❌ [FAIL] ${name}`); failed++; }
  };

  const server = http.createServer(app);
  await new Promise<void>(resolve => server.listen(0, resolve));
  const port = (server.address() as { port: number }).port;

  const reg = await AuthService.register({
    firstName: 'Alice', lastName: 'DealsApi', email: 'alice.deals.api@crm.local', password: 'Password123!',
  });
  const token = reg.token;
  const ws = reg.user.workspaceId;
  const auth = { Authorization: `Bearer ${token}` };

  const contact = await ContactsService.create(
    { userId: reg.user.id, workspaceId: ws, role: Role.ADMIN },
    { firstName: 'Contact', lastName: 'Api', phone: '+33699999999', ownerId: reg.user.id }
  );

  try {
    console.log('--- Tests authentification ---');
    assert((await API(port, '/api/deals')).status === 401, 'GET /api/deals sans token → 401');

    console.log('\n--- Tests CREATE (API) ---');
    const invalid = await API(port, '/api/deals', {
      method: 'POST', headers: auth, body: JSON.stringify({ title: '', value: -1, contactId: contact.id }),
    });
    assert(invalid.status === 400, 'Données invalides → 400');

    const created = await API(port, '/api/deals', {
      method: 'POST', headers: auth,
      body: JSON.stringify({ title: 'Contrat API', value: 15000, stage: DealStage.PROPOSITION, contactId: contact.id }),
    });
    const createBody = await created.json() as ApiJson;
    assert(created.status === 201, 'Création valide → 201');
    const dealId = createBody.data?.id as string;

    console.log('\n--- Tests READ (API) ---');
    const list = await API(port, '/api/deals?page=1&limit=10', { headers: auth });
    const listBody = await list.json() as ApiJson;
    assert(list.status === 200 && Array.isArray(listBody.data), 'GET /api/deals → 200');
    assert(typeof listBody.pagination?.total === 'number', 'Pagination présente');

    const stats = await API(port, '/api/deals/stats', { headers: auth });
    const statsBody = await stats.json() as ApiJson;
    assert(stats.status === 200 && statsBody.data?.LEAD, 'GET /api/deals/stats → 200');

    const search = await API(port, '/api/deals?search=Contrat', { headers: auth });
    const searchBody = await search.json() as ApiJson;
    assert(searchBody.data?.length > 0, 'Recherche par titre');

    console.log('\n--- Tests PATCH stage (API) ---');
    const patch = await API(port, `/api/deals/${dealId}/stage`, {
      method: 'PATCH', headers: auth, body: JSON.stringify({ stage: DealStage.NEGOTIATION }),
    });
    const patchBody = await patch.json() as ApiJson;
    assert(patch.status === 200, 'PATCH stage → 200');
    assert(patchBody.data?.stage === DealStage.NEGOTIATION, 'Étape mise à jour');

    console.log('\n--- Tests DELETE (API) ---');
    const del = await API(port, `/api/deals/${dealId}`, { method: 'DELETE', headers: auth });
    assert(del.status === 204, 'DELETE → 204');

    console.log(`\n📊 Résultats API : ${passed} réussis, ${failed} échoués.`);
    if (failed > 0) process.exit(1);
  } finally {
    server.close();
    await prisma.deal.deleteMany({ where: { workspaceId: ws } });
    await prisma.contact.deleteMany({ where: { workspaceId: ws } });
    await prisma.user.deleteMany({ where: { email: 'alice.deals.api@crm.local' } });
    await prisma.workspace.deleteMany({ where: { id: ws } });
    await prisma.$disconnect();
  }
}

runTests().catch(e => { console.error('❌ Erreur critique:', e); process.exit(1); });

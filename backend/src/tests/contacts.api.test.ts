import './setup.js';
import http from 'http';
import app from '../app.js';
import { prisma } from '../services/prisma.js';
import { AuthService } from '../modules/auth/auth.service.js';

const API = (port: number, path: string, options: RequestInit = {}) =>
  fetch(`http://127.0.0.1:${port}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    },
  });

type ApiJson = Record<string, any>;

async function runTests() {
  console.log('🧪 Démarrage des tests API HTTP du module Contacts...\n');
  let passed = 0;
  let failed = 0;

  const assert = (condition: boolean, name: string) => {
    if (condition) { console.log(`  ✅ [PASS] ${name}`); passed++; }
    else { console.error(`  ❌ [FAIL] ${name}`); failed++; }
  };

  const server = http.createServer(app);
  await new Promise<void>(resolve => server.listen(0, resolve));
  const port = (server.address() as { port: number }).port;

  const regA = await AuthService.register({
    firstName: 'Alice', lastName: 'Api', email: 'alice.contacts.api@crm.local', password: 'Password123!',
  });
  const regB = await AuthService.register({
    firstName: 'Bob', lastName: 'Api', email: 'bob.contacts.api@crm.local', password: 'Password123!',
    workspaceName: 'Workspace B API Tests',
  });
  const tokenA = regA.token;
  const tokenB = regB.token;
  const wsA = regA.user.workspaceId;

  const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

  try {
    // ── Non authentifié ─────────────────────────────────────────────────────
    console.log('--- Tests authentification ---');
    const unauth = await API(port, '/api/contacts');
    assert(unauth.status === 401, 'GET /api/contacts sans token → 401');

    const unauthPost = await API(port, '/api/contacts', {
      method: 'POST',
      body: JSON.stringify({ firstName: 'X', lastName: 'Y', phone: '+33600000001' }),
    });
    assert(unauthPost.status === 401, 'POST /api/contacts sans token → 401');

    // ── CREATE ────────────────────────────────────────────────────────────────
    console.log('\n--- Tests CREATE (API) ---');
    const invalidCreate = await API(port, '/api/contacts', {
      method: 'POST',
      headers: auth(tokenA),
      body: JSON.stringify({ firstName: '', lastName: 'Test', phone: 'bad' }),
    });
    assert(invalidCreate.status === 400, 'Données invalides → 400');

    const validCreate = await API(port, '/api/contacts', {
      method: 'POST',
      headers: auth(tokenA),
      body: JSON.stringify({
        firstName: 'Jean',
        lastName: 'Dupont',
        phone: '+33612345678',
        email: 'jean.api@example.com',
        company: 'ACME',
        tags: ['prospect'],
      }),
    });
    const createBody = await validCreate.json() as ApiJson;
    assert(validCreate.status === 201, 'Création valide → 201');
    assert(createBody.data?.firstName === 'Jean', 'Contact créé avec bon prénom');
    const contactId = createBody.data?.id as string;

    const crossOwner = await API(port, '/api/contacts', {
      method: 'POST',
      headers: auth(tokenA),
      body: JSON.stringify({
        firstName: 'Cross', lastName: 'Owner', phone: '+33600000002', ownerId: regB.user.id,
      }),
    });
    assert(crossOwner.status === 400, 'Owner cross-workspace → 400');

    // ── READ ──────────────────────────────────────────────────────────────────
    console.log('\n--- Tests READ (API) ---');
    const list = await API(port, '/api/contacts?page=1&limit=10', { headers: auth(tokenA) });
    const listBody = await list.json() as ApiJson;
    assert(list.status === 200, 'GET /api/contacts → 200');
    assert(Array.isArray(listBody.data), 'Liste retournée');
    assert(typeof listBody.pagination?.total === 'number', 'Pagination présente');

    const search = await API(port, '/api/contacts?search=Jean', { headers: auth(tokenA) });
    const searchBody = await search.json() as ApiJson;
    assert(searchBody.data.some((c: any) => c.firstName === 'Jean'), 'Recherche par nom fonctionne');

    const detail = await API(port, `/api/contacts/${contactId}`, { headers: auth(tokenA) });
    assert(detail.status === 200, 'GET /api/contacts/:id → 200');

    const crossRead = await API(port, `/api/contacts/${contactId}`, { headers: auth(tokenB) });
    assert(crossRead.status === 404, 'Contact autre workspace → 404');

    const notFound = await API(port, '/api/contacts/non-existent-id', { headers: auth(tokenA) });
    assert(notFound.status === 404, 'Contact inexistant → 404');

    // ── UPDATE ────────────────────────────────────────────────────────────────
    console.log('\n--- Tests UPDATE (API) ---');
    const update = await API(port, `/api/contacts/${contactId}`, {
      method: 'PUT',
      headers: auth(tokenA),
      body: JSON.stringify({ company: 'Updated Corp' }),
    });
    const updateBody = await update.json() as ApiJson;
    assert(update.status === 200, 'PUT valide → 200');
    assert(updateBody.data?.company === 'Updated Corp', 'Champ société mis à jour');

    const crossUpdate = await API(port, `/api/contacts/${contactId}`, {
      method: 'PUT',
      headers: auth(tokenB),
      body: JSON.stringify({ company: 'Hacked' }),
    });
    assert(crossUpdate.status === 404, 'Update cross-workspace → 404');

    // ── DELETE ────────────────────────────────────────────────────────────────
    console.log('\n--- Tests DELETE (API) ---');
    const toDelete = await API(port, '/api/contacts', {
      method: 'POST',
      headers: auth(tokenA),
      body: JSON.stringify({ firstName: 'Del', lastName: 'Me', phone: '+33600000099' }),
    });
    const delId = ((await toDelete.json()) as ApiJson).data.id;

    const del = await API(port, `/api/contacts/${delId}`, { method: 'DELETE', headers: auth(tokenA) });
    assert(del.status === 204, 'DELETE valide → 204');

    const afterDel = await API(port, `/api/contacts/${delId}`, { headers: auth(tokenA) });
    assert(afterDel.status === 404, 'Contact supprimé → 404');

    const crossDel = await API(port, `/api/contacts/${contactId}`, { method: 'DELETE', headers: auth(tokenB) });
    assert(crossDel.status === 404, 'Delete cross-workspace → 404');

    console.log(`\n📊 Résultats API : ${passed} réussis, ${failed} échoués.`);
    if (failed > 0) process.exit(1);
  } finally {
    server.close();
    await prisma.contact.deleteMany({ where: { workspaceId: wsA } });
    await prisma.user.deleteMany({
      where: { email: { in: ['alice.contacts.api@crm.local', 'bob.contacts.api@crm.local'] } },
    });
    await prisma.workspace.deleteMany({
      where: { id: { in: [wsA, regB.user.workspaceId] } },
    });
    await prisma.$disconnect();
  }
}

runTests().catch(e => { console.error('❌ Erreur critique:', e); process.exit(1); });

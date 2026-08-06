/**
 * NF-04 : vérification basique des temps de réponse avec un volume élevé.
 */
import './setup.js';
import { prisma } from '../services/prisma.js';
import { ContactsService } from '../modules/contacts/contacts.service.js';
import { CallsService } from '../modules/calls/calls.service.js';
import { Role } from '../types/enums.js';

const CONTACT_TARGET = 500;
const LIST_THRESHOLD_MS = 500;
const CALL_LIST_THRESHOLD_MS = 500;

async function runTests() {
  console.log('⚡ Tests de performance NF-04...\n');
  let passed = 0;
  let failed = 0;

  const assert = (condition: boolean, name: string, detail?: string) => {
    if (condition) {
      console.log(`  ✅ [PASS] ${name}${detail ? ` (${detail})` : ''}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${name}${detail ? ` (${detail})` : ''}`);
      failed++;
    }
  };

  const workspace = await prisma.workspace.create({ data: { name: 'Perf Test Workspace' } });
  const admin = await prisma.user.create({
    data: {
      firstName: 'Perf',
      lastName: 'Admin',
      email: `perf.admin.${Date.now()}@crm.local`,
      passwordHash: 'hash-not-used',
      role: Role.ADMIN,
      workspaceId: workspace.id,
    },
  });

  const auth = { userId: admin.id, workspaceId: workspace.id, role: Role.ADMIN };

  const contacts = Array.from({ length: CONTACT_TARGET }, (_, i) => ({
    firstName: 'Perf',
    lastName: `Contact-${i}`,
    phone: `+337${String(i).padStart(8, '0')}`,
    ownerId: admin.id,
    workspaceId: workspace.id,
  }));

  for (let i = 0; i < contacts.length; i += 100) {
    await prisma.contact.createMany({ data: contacts.slice(i, i + 100) });
  }

  const sampleContacts = await prisma.contact.findMany({
    where: { workspaceId: workspace.id },
    select: { id: true, phone: true },
    take: 200,
  });

  await prisma.call.createMany({
    data: sampleContacts.map((c, i) => ({
      callerNumber: c.phone,
      calledNumber: '+33180001122',
      direction: 'OUTBOUND',
      status: 'COMPLETED',
      duration: 120,
      agentId: admin.id,
      contactId: c.id,
      workspaceId: workspace.id,
    })),
  });

  try {
    const t0 = performance.now();
    const list = await ContactsService.getAll(auth, { page: 1, limit: 50 });
    const contactMs = performance.now() - t0;

    assert(list.data.length === 50, 'Liste paginée retourne 50 contacts');
    assert(list.pagination.total >= CONTACT_TARGET, 'Total contacts comptabilisé', String(list.pagination.total));
    assert(contactMs < LIST_THRESHOLD_MS, 'GET contacts page 1 < 500 ms', `${contactMs.toFixed(0)} ms`);

    const t1 = performance.now();
    const search = await ContactsService.getAll(auth, { search: 'Perf', page: 1, limit: 20 });
    const searchMs = performance.now() - t1;

    assert(search.data.length > 0, 'Recherche sur volume élevé retourne des résultats');
    assert(searchMs < LIST_THRESHOLD_MS, 'Recherche contacts < 500 ms', `${searchMs.toFixed(0)} ms`);

    const t2 = performance.now();
    const calls = await CallsService.getAll(auth, { page: 1, limit: 50 });
    const callMs = performance.now() - t2;

    assert(calls.data.length === 50, 'Liste appels paginée retourne 50 résultats');
    assert(callMs < CALL_LIST_THRESHOLD_MS, 'GET appels page 1 < 500 ms', `${callMs.toFixed(0)} ms`);

    console.log(`\n📊 Résultats perf : ${passed} réussis, ${failed} échoués.`);
    if (failed > 0) process.exit(1);
  } finally {
    await prisma.call.deleteMany({ where: { workspaceId: workspace.id } });
    await prisma.contact.deleteMany({ where: { workspaceId: workspace.id } });
    await prisma.user.deleteMany({ where: { workspaceId: workspace.id } });
    await prisma.workspace.delete({ where: { id: workspace.id } });
    await prisma.$disconnect();
  }
}

runTests().catch((e) => {
  console.error('❌ Erreur critique perf:', e);
  process.exit(1);
});

import './setup.js';
import { prisma } from '../services/prisma.js';
import { CallsService } from '../modules/calls/calls.service.js';
import { AuthService } from '../modules/auth/auth.service.js';
import { ContactsService } from '../modules/contacts/contacts.service.js';
import { initTelephonyProvider } from '../telephony/telephony.service.js';
import { validateStartCall } from '../modules/calls/calls.validation.js';
import { CallStatus, Role } from '../types/enums.js';

async function runTests() {
  console.log('🧪 Démarrage des tests du module Calls...\n');
  let passed = 0;
  let failed = 0;

  initTelephonyProvider(CallsService.handleProviderStatusChange.bind(CallsService));

  const assert = (condition: boolean, name: string) => {
    if (condition) { console.log(`  ✅ [PASS] ${name}`); passed++; }
    else { console.error(`  ❌ [FAIL] ${name}`); failed++; }
  };

  const regA = await AuthService.register({
    firstName: 'Alice', lastName: 'Calls', email: 'alice.calls.test@crm.local', password: 'Password123!',
    workspaceName: 'Calls Test WS',
  });
  const regB = await AuthService.register({
    firstName: 'Bob', lastName: 'Calls', email: 'bob.calls.test@crm.local', password: 'Password123!',
    workspaceName: 'Calls WS B',
  });
  const wsA = regA.user.workspaceId;
  const wsB = regB.user.workspaceId;
  const authA = { userId: regA.user.id, workspaceId: wsA, role: Role.ADMIN };

  const contactA = await ContactsService.create(authA, {
    firstName: 'Jean', lastName: 'Tel', phone: '+33612345678', ownerId: regA.user.id,
  });
  const contactB = await ContactsService.create(
    { userId: regB.user.id, workspaceId: wsB, role: Role.ADMIN },
    { firstName: 'Other', lastName: 'Tel', phone: '+33698765432', ownerId: regB.user.id }
  );

  try {
    console.log('--- Tests VALIDATION ---');
    assert(!validateStartCall({ phoneNumber: 'bad' }).isValid, 'Numéro invalide rejeté');
    assert(validateStartCall({ phoneNumber: '+33612345678' }).isValid, 'Numéro valide accepté');

    console.log('\n--- Tests START CALL ---');
    const call = await CallsService.startCall(authA, { phoneNumber: '+33612345678', contactId: contactA.id });
    assert(call.status === CallStatus.RINGING, 'Appel créé en RINGING');
    assert(call.workspaceId === wsA, 'workspaceId depuis JWT');
    assert(call.agentId === regA.user.id, 'agentId depuis JWT');
    assert(call.contactId === contactA.id, 'Contact associé');

    const autoContact = await CallsService.startCall(authA, { phoneNumber: contactA.phone });
    assert(autoContact.contactId === contactA.id, 'Association auto contact par numéro');

    try {
      await CallsService.startCall(authA, { phoneNumber: '+33600000001', contactId: contactB.id });
      assert(false, 'Contact cross-workspace devrait échouer');
    } catch (e: any) { assert(e.statusCode === 400, 'Contact cross-workspace → 400'); }

    console.log('\n--- Tests GET / STATUS ---');
    const detail = await CallsService.getById(call.id, authA);
    assert(detail.id === call.id, 'Récupération appel');

    try {
      await CallsService.getById(call.id, { userId: regB.user.id, workspaceId: wsB, role: Role.ADMIN });
      assert(false, 'Cross-workspace read devrait échouer');
    } catch (e: any) { assert(e.statusCode === 404, 'Cross-workspace → 404'); }

    await new Promise(r => setTimeout(r, 1600));
    const connected = await CallsService.getById(call.id, authA);
    assert(connected.status === CallStatus.CONNECTED, 'MockProvider passe à CONNECTED');

    console.log('\n--- Tests HISTORIQUE (liste, filtres, note) ---');
    const list = await CallsService.getAll(authA, {});
    assert(list.data.length >= 2, 'Liste des appels');
    assert(typeof list.pagination.total === 'number', 'Pagination historique');

    const byContact = await CallsService.getAll(authA, { contactId: contactA.id });
    assert(byContact.data.every(c => c.contactId === contactA.id), 'Filtre par contact');

    const byDirection = await CallsService.getAll(authA, { direction: 'OUTBOUND' as any });
    assert(byDirection.data.every(c => c.direction === 'OUTBOUND'), 'Filtre par direction');

    const search = await CallsService.getAll(authA, { search: '33612345678' });
    assert(search.data.length > 0, 'Recherche par numéro');

    const noted = await CallsService.updateNote(call.id, authA, 'Compte-rendu test');
    assert(noted.note === 'Compte-rendu test', 'Note mise à jour');

    console.log('\n--- Tests MUTE / HANGUP ---');
    const muted = await CallsService.mute(call.id, authA);
    assert(muted.muted === true, 'Mute OK');

    const unmuted = await CallsService.unmute(call.id, authA);
    assert(unmuted.muted === false, 'Unmute OK');

    const hungUp = await CallsService.hangup(call.id, authA);
    assert(hungUp.status === CallStatus.COMPLETED, 'Hangup → COMPLETED');
    assert(hungUp.duration >= 0, 'Durée enregistrée');

    try {
      await CallsService.hangup(call.id, authA);
      assert(false, 'Double hangup devrait échouer');
    } catch (e: any) { assert(e.statusCode === 400, 'Appel déjà terminé → 400'); }

    console.log(`\n📊 Résultats : ${passed} réussis, ${failed} échoués.`);
    if (failed > 0) process.exit(1);
  } finally {
    await prisma.call.deleteMany({ where: { workspaceId: { in: [wsA, wsB] } } });
    await prisma.contact.deleteMany({ where: { workspaceId: { in: [wsA, wsB] } } });
    await prisma.user.deleteMany({
      where: { email: { in: ['alice.calls.test@crm.local', 'bob.calls.test@crm.local'] } },
    });
    await prisma.workspace.deleteMany({ where: { id: { in: [wsA, wsB] } } });
    await prisma.$disconnect();
  }
}

runTests().catch(e => { console.error('❌ Erreur critique:', e); process.exit(1); });

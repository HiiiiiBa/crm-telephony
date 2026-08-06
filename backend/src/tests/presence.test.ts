import './setup.js';
import { prisma } from '../services/prisma.js';
import { AuthService } from '../modules/auth/auth.service.js';
import { PresenceService } from '../modules/presence/presence.service.js';
import { CallsService } from '../modules/calls/calls.service.js';
import { Role, PresenceStatus } from '../types/enums.js';

async function runTests() {
  console.log('🧪 Tests module Présence (Ringover)...\n');
  let passed = 0;
  let failed = 0;

  const assert = (cond: boolean, name: string) => {
    if (cond) { console.log(`  ✅ [PASS] ${name}`); passed++; }
    else { console.error(`  ❌ [FAIL] ${name}`); failed++; }
  };

  const adminReg = await AuthService.register({
    firstName: 'Pres', lastName: 'Admin', email: 'pres.admin@test.local', password: 'Password123!',
    workspaceName: 'Presence WS',
  });
  const ws = adminReg.user.workspaceId;
  const adminAuth = { userId: adminReg.user.id, workspaceId: ws, role: Role.ADMIN };

  assert(adminReg.user.presenceStatus === PresenceStatus.ONLINE, 'Inscription → ONLINE');

  try {
    console.log('--- Changement manuel de statut ---');
    const paused = await PresenceService.updateMyPresence(adminAuth, PresenceStatus.PAUSE);
    assert(paused.presenceStatus === PresenceStatus.PAUSE, 'Passage en PAUSE');

    const online = await PresenceService.updateMyPresence(adminAuth, PresenceStatus.ONLINE);
    assert(online.presenceStatus === PresenceStatus.ONLINE, 'Retour ONLINE');

    try {
      await PresenceService.updateMyPresence(adminAuth, PresenceStatus.ON_CALL);
      assert(false, 'ON_CALL manuel interdit');
    } catch (e: any) {
      assert(e.statusCode === 400, 'ON_CALL manuel → 400');
    }

    console.log('\n--- Résumé équipe ---');
    const summary = await PresenceService.getSummary(adminAuth);
    assert(summary.online >= 1, 'Au moins 1 agent online');
    assert(summary.total >= 1, 'Total agents');

    console.log('\n--- Appel → ON_CALL puis restore ---');
    await PresenceService.updateMyPresence(adminAuth, PresenceStatus.ONLINE);
    await CallsService.startCall(adminAuth, { phoneNumber: '+33699998888' });
    const onCallUser = await prisma.user.findUnique({ where: { id: adminAuth.userId } });
    assert(onCallUser?.presenceStatus === PresenceStatus.ON_CALL, 'startCall → ON_CALL');

    await PresenceService.restoreAfterCall(adminAuth.userId);
    const restored = await prisma.user.findUnique({ where: { id: adminAuth.userId } });
    assert(restored?.presenceStatus === PresenceStatus.ONLINE, 'restoreAfterCall → ONLINE');

    await prisma.call.deleteMany({ where: { workspaceId: ws } });
    await prisma.user.deleteMany({ where: { workspaceId: ws } });
    await prisma.workspace.delete({ where: { id: ws } });

    console.log(`\n📊 Résultats : ${passed} réussis, ${failed} échoués.`);
    if (failed > 0) process.exit(1);
  } catch (e) {
    console.error('❌ Erreur :', e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runTests();

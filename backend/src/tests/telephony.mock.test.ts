import { MockTelephonyProvider } from '../telephony/mock.telephony.provider.js';
import { CallStatus } from '../types/enums.js';

async function runTests() {
  console.log('🧪 Tests MockTelephonyProvider...\n');
  let passed = 0;
  let failed = 0;

  const assert = (condition: boolean, name: string) => {
    if (condition) { console.log(`  ✅ [PASS] ${name}`); passed++; }
    else { console.error(`  ❌ [FAIL] ${name}`); failed++; }
  };

  const provider = new MockTelephonyProvider();
  const statusChanges: Array<{ callId: string; status: CallStatus }> = [];

  provider.setStatusChangeHandler(async (callId, status) => {
    statusChanges.push({ callId, status });
  });

  await provider.initiateCall('call-1', '+33180001122', '+33612345678');
  assert(provider.getCallStatus('call-1') === CallStatus.RINGING, 'Statut initial RINGING');

  await new Promise(r => setTimeout(r, 1600));
  assert(provider.getCallStatus('call-1') === CallStatus.CONNECTED, 'Passage à CONNECTED après délai');
  assert(statusChanges.some(s => s.status === CallStatus.CONNECTED), 'Handler CONNECTED appelé');

  await provider.muteCall('call-1');
  assert(provider.isMuted('call-1'), 'Mute activé');

  await provider.unmuteCall('call-1');
  assert(!provider.isMuted('call-1'), 'Mute désactivé');

  await provider.hangupCall('call-1');
  assert(provider.getCallStatus('call-1') === null, 'Appel supprimé après hangup');

  console.log(`\n📊 Résultats MockProvider : ${passed} réussis, ${failed} échoués.`);
  if (failed > 0) process.exit(1);
}

runTests().catch(e => { console.error(e); process.exit(1); });

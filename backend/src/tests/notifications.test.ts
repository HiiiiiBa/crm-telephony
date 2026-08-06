import './setup.js';
import http from 'http';
import app from '../app.js';
import { prisma } from '../services/prisma.js';
import { AuthService } from '../modules/auth/auth.service.js';
import { NotificationsService } from '../modules/notifications/notifications.service.js';
import { NotificationType } from '../types/enums.js';

async function runTests() {
  console.log('🧪 Tests module Notifications...\n');
  let passed = 0;
  let failed = 0;

  const assert = (cond: boolean, name: string) => {
    if (cond) { console.log(`  ✅ [PASS] ${name}`); passed++; }
    else { console.error(`  ❌ [FAIL] ${name}`); failed++; }
  };

  const reg = await AuthService.register({
    firstName: 'Notif', lastName: 'User', email: 'notif.user@test.local', password: 'Password123!',
    workspaceName: 'Notif WS',
  });
  const ws = reg.user.workspaceId;
  const userId = reg.user.id;

  const server = http.createServer(app);
  await new Promise<void>(resolve => server.listen(0, resolve));
  const port = (server.address() as { port: number }).port;
  const auth = { Authorization: `Bearer ${reg.token}` };

  try {
    await NotificationsService.create({
      userId,
      workspaceId: ws,
      type: NotificationType.NEW_SMS,
      title: 'Test SMS',
      body: 'Message test',
      link: '/messages',
    });

    const listRes = await fetch(`http://127.0.0.1:${port}/api/notifications`, { headers: auth });
    const listJson = await listRes.json();
    assert(listRes.status === 200, 'GET /notifications → 200');
    assert(listJson.unreadCount >= 1, 'unreadCount >= 1');
    assert(Array.isArray(listJson.data), 'data est un tableau');

    const notifId = listJson.data[0].id;
    const readRes = await fetch(`http://127.0.0.1:${port}/api/notifications/${notifId}/read`, {
      method: 'PATCH',
      headers: auth,
    });
    assert(readRes.status === 200, 'PATCH read → 200');

    const allRead = await fetch(`http://127.0.0.1:${port}/api/notifications/read-all`, {
      method: 'POST',
      headers: auth,
    });
    assert(allRead.status === 200, 'POST read-all → 200');

    console.log(`\n📊 Résultats : ${passed} réussis, ${failed} échoués.`);
    if (failed > 0) process.exit(1);
  } finally {
    server.close();
    await prisma.notification.deleteMany({ where: { workspaceId: ws } });
    await prisma.user.deleteMany({ where: { workspaceId: ws } });
    await prisma.workspace.delete({ where: { id: ws } });
    await prisma.$disconnect();
  }
}

runTests().catch(e => { console.error(e); process.exit(1); });

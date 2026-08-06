import './setup.js';
import { prisma } from '../services/prisma.js';
import { AuthService } from '../modules/auth/auth.service.js';
import { UsersService } from '../modules/users/users.service.js';
import { DashboardService } from '../modules/dashboard/dashboard.service.js';
import { ContactsService } from '../modules/contacts/contacts.service.js';
import { DealsService } from '../modules/deals/deals.service.js';
import { Role, DealStage, CallStatus, CallDirection } from '../types/enums.js';

async function runTests() {
  console.log('🧪 Tests module Dashboard (Ringover-style)...\n');
  let passed = 0;
  let failed = 0;

  const assert = (cond: boolean, name: string) => {
    if (cond) { console.log(`  ✅ [PASS] ${name}`); passed++; }
    else { console.error(`  ❌ [FAIL] ${name}`); failed++; }
  };

  const adminReg = await AuthService.register({
    firstName: 'Dash', lastName: 'Admin', email: 'dash.admin@test.local', password: 'Password123!',
    workspaceName: 'Dashboard Test WS',
  });
  const ws = adminReg.user.workspaceId;
  const adminAuth = { userId: adminReg.user.id, workspaceId: ws, role: Role.ADMIN };

  const agentReg = await UsersService.invite(adminAuth, {
    firstName: 'Dash', lastName: 'Agent', email: 'dash.agent@test.local', password: 'Password123!',
  });
  const agentAuth = { userId: agentReg.id, workspaceId: ws, role: Role.AGENT };

  const adminContact = await ContactsService.create(adminAuth, {
    firstName: 'Client', lastName: 'Admin', phone: '+33611110001',
  });
  const agentContact = await ContactsService.create(agentAuth, {
    firstName: 'Client', lastName: 'Agent', phone: '+33611110002',
  });

  await DealsService.create(adminAuth, {
    title: 'Deal ouvert', value: 10000, stage: DealStage.LEAD, contactId: adminContact.id,
  });
  await DealsService.create(adminAuth, {
    title: 'Deal gagné', value: 25000, stage: DealStage.GAGNE, contactId: adminContact.id,
  });

  await prisma.call.create({
    data: {
      callerNumber: adminContact.phone,
      calledNumber: '+33180001122',
      direction: CallDirection.INBOUND,
      status: CallStatus.COMPLETED,
      duration: 120,
      agentId: adminReg.user.id,
      contactId: adminContact.id,
      workspaceId: ws,
      startedAt: new Date(),
      endedAt: new Date(),
    },
  });

  await prisma.call.create({
    data: {
      callerNumber: '+33180001122',
      calledNumber: agentContact.phone,
      direction: CallDirection.OUTBOUND,
      status: CallStatus.MISSED,
      agentId: agentReg.id,
      contactId: agentContact.id,
      workspaceId: ws,
    },
  });

  await prisma.call.create({
    data: {
      callerNumber: '+33180001122',
      calledNumber: adminContact.phone,
      direction: CallDirection.OUTBOUND,
      status: CallStatus.RINGING,
      agentId: adminReg.user.id,
      contactId: adminContact.id,
      workspaceId: ws,
    },
  });

  try {
    console.log('--- Test Admin : KPIs + live + graphiques ---');
    const adminDash = await DashboardService.getDashboard(adminAuth, 14, 'ALL');
    assert(adminDash.kpis.totalContacts >= 2, 'F-63 totalContacts');
    assert(adminDash.kpis.totalCalls >= 2, 'F-63 totalCalls');
    assert(adminDash.kpis.inboundCalls >= 1, 'KPI inboundCalls');
    assert(adminDash.kpis.outboundCalls >= 1, 'KPI outboundCalls');
    assert(typeof adminDash.kpis.serviceLevelPercent === 'number', 'KPI serviceLevelPercent');
    assert(adminDash.kpis.openDeals >= 1, 'F-63 openDeals');
    assert(adminDash.kpis.wonRevenue >= 25000, 'F-63 wonRevenue');
    assert(adminDash.liveActivity.callsInProgress >= 1, 'Live callsInProgress');
    assert(adminDash.liveActivity.totalActiveAgents >= 2, 'Live totalActiveAgents');
    assert(typeof adminDash.liveActivity.agentsOnPause === 'number', 'Live agentsOnPause');
    assert(adminDash.teamPresence !== null && adminDash.teamPresence!.length >= 2, 'teamPresence');
    assert(adminDash.callVolume !== null && adminDash.callVolume!.length === 14, 'callVolume 14 jours');
    assert(adminDash.agentPerformance !== null && adminDash.agentPerformance!.length >= 1, 'agentPerformance');
    assert(adminDash.pipelineByStage !== null, 'F-62 pipelineByStage');

    console.log('\n--- Test filtres direction ---');
    const inboundOnly = await DashboardService.getDashboard(adminAuth, 14, CallDirection.INBOUND);
    assert(inboundOnly.kpis.outboundCalls === 0, 'Filtre INBOUND exclut sortants');

    console.log('\n--- Test export CSV ---');
    const csv = await DashboardService.exportCsv(adminAuth, 7, 'ALL');
    assert(csv.includes('Niveau de service'), 'Export CSV contient KPIs');
    assert(csv.includes('Agent;'), 'Export CSV contient agents');

    console.log('\n--- Test Agent : KPIs + live personnel ---');
    const agentDash = await DashboardService.getDashboard(agentAuth);
    assert(agentDash.kpis.totalContacts === 1, 'Agent ne voit qu\'un contact');
    assert(agentDash.pipelineByStage === null, 'F-62 masqué pour Agent');
    assert(agentDash.agentPerformance === null, 'agentPerformance masqué pour Agent');
    assert(agentDash.liveActivity !== undefined, 'Live activity pour Agent');
    assert(agentDash.kpis.totalCalls >= 1, 'F-63 appels agent');

    await prisma.message.deleteMany({});
    await prisma.call.deleteMany({ where: { workspaceId: ws } });
    await prisma.deal.deleteMany({ where: { workspaceId: ws } });
    await prisma.contact.deleteMany({ where: { workspaceId: ws } });
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

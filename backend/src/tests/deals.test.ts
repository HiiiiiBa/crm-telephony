import './setup.js';
import { prisma } from '../services/prisma.js';
import { DealsService } from '../modules/deals/deals.service.js';
import { AuthService } from '../modules/auth/auth.service.js';
import { ContactsService } from '../modules/contacts/contacts.service.js';
import { validateCreateDeal, validateUpdateDealStage } from '../modules/deals/deals.validation.js';
import { DealStage, Role } from '../types/enums.js';

async function runTests() {
  console.log('🧪 Démarrage des tests du module Deals...\n');
  let passed = 0;
  let failed = 0;

  const assert = (condition: boolean, name: string) => {
    if (condition) { console.log(`  ✅ [PASS] ${name}`); passed++; }
    else { console.error(`  ❌ [FAIL] ${name}`); failed++; }
  };

  const regAdmin = await AuthService.register({
    firstName: 'Admin', lastName: 'Deals', email: 'admin.deals.test@crm.local', password: 'Password123!',
    workspaceName: 'Deals Test Workspace',
  });
  const wsA = regAdmin.user.workspaceId;
  const adminAuth = { userId: regAdmin.user.id, workspaceId: wsA, role: Role.ADMIN };

  const regB = await AuthService.register({
    firstName: 'Bob', lastName: 'Other', email: 'bob.deals.test@crm.local', password: 'Password123!',
    workspaceName: 'Deals Workspace B',
  });
  const wsB = regB.user.workspaceId;

  // Agent dans le même workspace que l'admin
  const regAgent = await AuthService.register({
    firstName: 'Agent', lastName: 'Deals', email: 'agent.deals.test@crm.local', password: 'Password123!',
    workspaceId: wsA,
  });
  const agentAuth = { userId: regAgent.user.id, workspaceId: wsA, role: Role.AGENT };

  const contactA = await ContactsService.create(adminAuth, {
    firstName: 'Client', lastName: 'Test', phone: '+33611111111', ownerId: regAdmin.user.id,
  });
  const contactB = await ContactsService.create(
    { userId: regB.user.id, workspaceId: wsB, role: Role.ADMIN },
    { firstName: 'Client', lastName: 'B', phone: '+33622222222', ownerId: regB.user.id }
  );

  try {
    // ── VALIDATION ────────────────────────────────────────────────────────────
    console.log('--- Tests VALIDATION ---');
    assert(!validateCreateDeal({ title: '', value: 100, contactId: 'x' }).isValid, 'Rejet sans titre');
    assert(!validateCreateDeal({ title: 'X', value: -1, contactId: 'x' }).isValid, 'Rejet valeur négative');
    assert(!validateCreateDeal({ title: 'X', value: 100, contactId: 'x', stage: 'INVALID' as DealStage }).isValid, 'Rejet étape invalide');
    assert(!validateUpdateDealStage({ stage: 'BAD' as DealStage }).isValid, 'Rejet changement étape invalide');

    // ── CREATE ────────────────────────────────────────────────────────────────
    console.log('\n--- Tests CREATE ---');
    const deal = await DealsService.create(adminAuth, {
      title: 'Projet CRM', value: 25000, stage: DealStage.LEAD, contactId: contactA.id, ownerId: regAdmin.user.id,
    });
    assert(deal.title === 'Projet CRM', 'Deal créé avec succès');
    assert(deal.workspaceId === wsA, 'Deal lié au bon workspace');

    try {
      await DealsService.create(adminAuth, { title: 'X', value: 100, contactId: contactB.id });
      assert(false, 'Contact cross-workspace devrait échouer');
    } catch (e: any) { assert(e.statusCode === 400, 'Contact cross-workspace → 400'); }

    try {
      await DealsService.create(adminAuth, { title: 'X', value: 100, contactId: contactA.id, ownerId: regB.user.id });
      assert(false, 'Owner cross-workspace devrait échouer');
    } catch (e: any) { assert(e.statusCode === 400, 'Owner cross-workspace → 400'); }

    // ── READ ──────────────────────────────────────────────────────────────────
    console.log('\n--- Tests READ ---');
    const list = await DealsService.getAll(adminAuth, {});
    assert(list.data.length >= 1, 'Liste des deals');
    assert(typeof list.pagination.total === 'number', 'Pagination retournée');

    const search = await DealsService.getAll(adminAuth, { search: 'CRM' });
    assert(search.data.some(d => d.title.includes('CRM')), 'Recherche par titre');

    const filtered = await DealsService.getAll(adminAuth, { stage: DealStage.LEAD });
    assert(filtered.data.every(d => d.stage === DealStage.LEAD), 'Filtre par étape');

    const page1 = await DealsService.getAll(adminAuth, { page: 1, limit: 1 });
    assert(page1.data.length === 1, 'Pagination limit=1');

    const detail = await DealsService.getById(deal.id, adminAuth);
    assert(detail.id === deal.id, 'Détail deal existant');

    try {
      await DealsService.getById(deal.id, { userId: regB.user.id, workspaceId: wsB, role: Role.ADMIN });
      assert(false, 'Cross-workspace read devrait échouer');
    } catch (e: any) { assert(e.statusCode === 404, 'Cross-workspace read → 404'); }

    // ── STATS ─────────────────────────────────────────────────────────────────
    console.log('\n--- Tests STATS ---');
    const stats = await DealsService.getStats(adminAuth);
    assert(typeof stats[DealStage.LEAD].count === 'number', 'Stats LEAD count');
    assert(typeof stats[DealStage.LEAD].totalValue === 'number', 'Stats LEAD totalValue');

    // ── UPDATE ────────────────────────────────────────────────────────────────
    console.log('\n--- Tests UPDATE ---');
    const updated = await DealsService.update(deal.id, adminAuth, { title: 'Projet CRM v2', value: 30000 });
    assert(updated.title === 'Projet CRM v2', 'Modification titre et valeur');

    const stageUpdated = await DealsService.updateStage(deal.id, adminAuth, DealStage.QUALIFIE);
    assert(stageUpdated.stage === DealStage.QUALIFIE, 'Changement d\'étape via updateStage');

    try {
      await DealsService.update(deal.id, { userId: regB.user.id, workspaceId: wsB, role: Role.ADMIN }, { title: 'Hack' });
      assert(false, 'Cross-workspace update devrait échouer');
    } catch (e: any) { assert(e.statusCode === 404, 'Cross-workspace update → 404'); }

    // ── PERMISSIONS ───────────────────────────────────────────────────────────
    console.log('\n--- Tests PERMISSIONS ---');
    const agentDeal = await DealsService.create(agentAuth, {
      title: 'Deal Agent', value: 5000, contactId: contactA.id, ownerId: regAgent.user.id,
    });

    // Agent voit son deal
    const agentList = await DealsService.getAll(agentAuth, {});
    assert(agentList.data.some(d => d.id === agentDeal.id), 'Agent voit ses deals');
    assert(!agentList.data.some(d => d.id === deal.id && d.ownerId === regAdmin.user.id), 'Agent ne voit pas les deals admin (sauf si owner)');

    // Agent ne peut pas modifier le deal de l'admin
    try {
      await DealsService.update(deal.id, agentAuth, { title: 'Hack' });
      assert(false, 'Agent ne peut pas modifier deal admin');
    } catch (e: any) { assert(e.statusCode === 403, 'Agent modification deal admin → 403'); }

    // Admin peut tout modifier
    const adminUpdate = await DealsService.update(agentDeal.id, adminAuth, { value: 6000 });
    assert(adminUpdate.value === 6000, 'Admin peut modifier deal agent');

    // ── DELETE ────────────────────────────────────────────────────────────────
    console.log('\n--- Tests DELETE ---');
    const toDelete = await DealsService.create(adminAuth, {
      title: 'To Delete', value: 1000, contactId: contactA.id,
    });
    await DealsService.delete(toDelete.id, adminAuth);
    try {
      await DealsService.getById(toDelete.id, adminAuth);
      assert(false, 'Deal supprimé');
    } catch (e: any) { assert(e.statusCode === 404, 'Deal supprimé → 404'); }

    try {
      await DealsService.delete(deal.id, { userId: regB.user.id, workspaceId: wsB, role: Role.ADMIN });
      assert(false, 'Cross-workspace delete devrait échouer');
    } catch (e: any) { assert(e.statusCode === 404, 'Cross-workspace delete → 404'); }

    console.log(`\n📊 Résultats : ${passed} réussis, ${failed} échoués.`);
    if (failed > 0) process.exit(1);
  } finally {
    await prisma.deal.deleteMany({ where: { workspaceId: { in: [wsA, wsB] } } });
    await prisma.contact.deleteMany({ where: { workspaceId: { in: [wsA, wsB] } } });
    await prisma.user.deleteMany({
      where: { email: { in: ['admin.deals.test@crm.local', 'bob.deals.test@crm.local', 'agent.deals.test@crm.local'] } },
    });
    await prisma.workspace.deleteMany({ where: { id: { in: [wsA, wsB] } } });
    await prisma.$disconnect();
  }
}

runTests().catch(e => { console.error('❌ Erreur critique:', e); process.exit(1); });

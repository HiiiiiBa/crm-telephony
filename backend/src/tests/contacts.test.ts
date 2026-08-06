import './setup.js';
import { prisma } from '../services/prisma.js';
import { ContactsService } from '../modules/contacts/contacts.service.js';
import { AuthService } from '../modules/auth/auth.service.js';
import { UsersService } from '../modules/users/users.service.js';
import { validateCreateContact, validateUpdateContact } from '../modules/contacts/contacts.validation.js';
import { Role } from '../types/enums.js';

async function runTests() {
  console.log('🧪 Démarrage des tests du module Contacts...\n');
  let passed = 0;
  let failed = 0;

  const assert = (condition: boolean, name: string) => {
    if (condition) { console.log(`  ✅ [PASS] ${name}`); passed++; }
    else { console.error(`  ❌ [FAIL] ${name}`); failed++; }
  };

  const regA = await AuthService.register({ firstName: 'Alice', lastName: 'Test', email: 'alice.contacts.test@crm.local', password: 'Password123!' });
  const regB = await AuthService.register({ firstName: 'Bob', lastName: 'Test', email: 'bob.contacts.test@crm.local', password: 'Password123!', workspaceName: 'Workspace B Contact Tests' });
  const wsA = regA.user.workspaceId;
  const wsB = regB.user.workspaceId;
  const userA = regA.user;
  const userB = regB.user;
  const adminAuth = { userId: userA.id, workspaceId: wsA, role: Role.ADMIN };
  const adminAuthB = { userId: userB.id, workspaceId: wsB, role: Role.ADMIN };

  try {
    console.log('\n--- Tests VALIDATION ---');
    const invalidVal = validateCreateContact({ firstName: '', lastName: 'X', phone: 'abc' });
    assert(!invalidVal.isValid, 'Validation rejete prénom vide et phone invalide');

    const invalidEmail = validateCreateContact({ firstName: 'A', lastName: 'B', phone: '+33612345678', email: 'bad-email' });
    assert(!invalidEmail.isValid, 'Validation rejete email invalide');

    const validVal = validateCreateContact({ firstName: 'A', lastName: 'B', phone: '+33612345678' });
    assert(validVal.isValid, 'Validation accepte données valides');

    const invalidUpdate = validateUpdateContact({ phone: '' });
    assert(!invalidUpdate.isValid, 'Validation update rejete phone vide');

    console.log('--- Tests CREATE ---');
    const contact = await ContactsService.create(adminAuth, {
      firstName: 'Jean',
      lastName: 'Dupont',
      phone: '+33612345678',
      email: 'jean.dupont@example.com',
      company: 'ACME Corp',
      tags: ['prospect'],
      notes: 'Premier contact de test.',
      ownerId: userA.id,
    });
    assert(contact.firstName === 'Jean', 'Contact créé avec succès');
    assert(contact.workspaceId === wsA, 'Contact lié au bon workspace');
    assert((contact as any).passwordHash === undefined, 'Pas de données sensibles exposées');

    const contactNoOwner = await ContactsService.create(adminAuth, {
      firstName: 'Marie',
      lastName: 'Curie',
      phone: '+33698765432',
    });
    assert(Boolean(contactNoOwner.ownerId), 'Owner assigné automatiquement si absent');

    try {
      await ContactsService.create(adminAuth, { firstName: 'Test', lastName: 'Cross', phone: '+33600000001', ownerId: userB.id });
      assert(false, 'Cross-workspace owner devrait échouer');
    } catch (e: any) {
      assert(e.statusCode === 400, 'Cross-workspace owner rejeté avec 400');
    }

    console.log('\n--- Tests READ (liste, search, pagination) ---');
    const list = await ContactsService.getAll(adminAuth, {});
    assert(list.data.length >= 2, 'Récupération de la liste des contacts du workspace');
    assert(typeof list.pagination.total === 'number', 'Pagination retournée');

    const listB = await ContactsService.getAll(adminAuthB, {});
    assert(listB.data.every(c => c.workspaceId === wsB), 'Isolation workspace : workspace B ne voit pas les contacts de workspace A');

    const searchResult = await ContactsService.getAll(adminAuth, { search: 'Jean' });
    assert(searchResult.data.some(c => c.firstName === 'Jean'), 'Recherche par prénom fonctionne');

    const emailSearch = await ContactsService.getAll(adminAuth, { search: 'dupont@example' });
    assert(emailSearch.data.length > 0, 'Recherche par email fonctionne');

    const page1 = await ContactsService.getAll(adminAuth, { page: 1, limit: 1 });
    assert(page1.data.length === 1, 'Pagination : limit=1 retourne 1 résultat');
    assert(page1.pagination.page === 1, 'Pagination : page=1 correcte');

    console.log('\n--- Tests READ (détail) ---');
    const detail = await ContactsService.getById(contact.id, adminAuth);
    assert(detail.id === contact.id, 'Récupération du détail d\'un contact existant');

    try {
      await ContactsService.getById('non-existent-id', adminAuth);
      assert(false, '404 pour contact inexistant');
    } catch (e: any) {
      assert(e.statusCode === 404, 'Contact inexistant → 404');
    }

    try {
      await ContactsService.getById(contact.id, adminAuthB);
      assert(false, 'Cross-workspace read devrait échouer');
    } catch (e: any) {
      assert(e.statusCode === 404, 'Cross-workspace read → 404');
    }

    console.log('\n--- Tests UPDATE ---');
    const updated = await ContactsService.update(contact.id, adminAuth, { company: 'New Corp', tags: ['client', 'vip'] });
    assert(updated.company === 'New Corp', 'Mise à jour du champ société');
    assert(updated.tags === JSON.stringify(['client', 'vip']), 'Mise à jour des tags');

    try {
      await ContactsService.update('non-existent-id', adminAuth, { company: 'X' });
      assert(false, '404 pour mise à jour contact inexistant');
    } catch (e: any) {
      assert(e.statusCode === 404, 'Update contact inexistant → 404');
    }

    try {
      await ContactsService.update(contact.id, adminAuthB, { company: 'Hacked' });
      assert(false, 'Cross-workspace update devrait échouer');
    } catch (e: any) {
      assert(e.statusCode === 404, 'Cross-workspace update → 404');
    }

    console.log('\n--- Tests DELETE ---');
    const toDelete = await ContactsService.create(adminAuth, { firstName: 'ToDelete', lastName: 'Contact', phone: '+33600000099' });

    await ContactsService.delete(toDelete.id, adminAuth);
    try {
      await ContactsService.getById(toDelete.id, adminAuth);
      assert(false, 'Suppression effective vérifiée');
    } catch (e: any) {
      assert(e.statusCode === 404, 'Contact supprimé → 404 à la récupération');
    }

    try {
      await ContactsService.delete(contact.id, adminAuthB);
      assert(false, 'Cross-workspace delete devrait échouer');
    } catch (e: any) {
      assert(e.statusCode === 404, 'Cross-workspace delete → 404');
    }

    console.log('\n--- Tests VISIBILITÉ PAR RÔLE ---');
    const agentReg = await UsersService.invite(
      { userId: userA.id, workspaceId: wsA, role: Role.ADMIN },
      { firstName: 'Agent', lastName: 'Visu', email: 'agent.visu.contacts@crm.local', password: 'Password123!' }
    );
    const agentAuth = { userId: agentReg.id, workspaceId: wsA, role: Role.AGENT };

    const adminContact = await ContactsService.create(adminAuth, {
      firstName: 'AdminOnly',
      lastName: 'Contact',
      phone: '+33655555555',
      ownerId: userA.id,
    });

    const agentContact = await ContactsService.create(agentAuth, {
      firstName: 'AgentOwn',
      lastName: 'Contact',
      phone: '+33666666666',
    });

    const agentList = await ContactsService.getAll(agentAuth, {});
    assert(agentList.data.some(c => c.id === agentContact.id), 'Agent voit son contact');
    assert(!agentList.data.some(c => c.id === adminContact.id), 'Agent ne voit pas le contact admin');

    try {
      await ContactsService.getById(adminContact.id, agentAuth);
      assert(false, 'Agent ne devrait pas accéder au contact admin');
    } catch (e: any) {
      assert(e.statusCode === 404, 'Accès contact non assigné → 404');
    }

    const adminList = await ContactsService.getAll(adminAuth, {});
    assert(adminList.data.some(c => c.id === adminContact.id), 'Admin voit tous les contacts');

    console.log(`\n📊 Résultats : ${passed} réussis, ${failed} échoués.`);
    if (failed > 0) process.exit(1);

  } finally {
    await prisma.contact.deleteMany({ where: { workspaceId: { in: [wsA, wsB] } } });
    await prisma.user.deleteMany({ where: { email: { in: ['alice.contacts.test@crm.local', 'bob.contacts.test@crm.local', 'agent.visu.contacts@crm.local'] } } });
    await prisma.workspace.deleteMany({ where: { id: { in: [wsA, wsB] } } });
    await prisma.$disconnect();
  }
}

runTests().catch(e => { console.error('❌ Erreur critique:', e); process.exit(1); });

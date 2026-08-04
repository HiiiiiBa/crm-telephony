import { prisma } from '../services/prisma.js';
import { ContactsService } from '../modules/contacts/contacts.service.js';
import { AuthService } from '../modules/auth/auth.service.js';

async function runTests() {
  console.log('🧪 Démarrage des tests du module Contacts...\n');
  let passed = 0;
  let failed = 0;

  const assert = (condition: boolean, name: string) => {
    if (condition) { console.log(`  ✅ [PASS] ${name}`); passed++; }
    else { console.error(`  ❌ [FAIL] ${name}`); failed++; }
  };

  // ── Setup : créer deux workspaces distincts pour tester l'isolation ──────
  const regA = await AuthService.register({ firstName: 'Alice', lastName: 'Test', email: 'alice.contacts.test@crm.local', password: 'Password123!' });
  const regB = await AuthService.register({ firstName: 'Bob', lastName: 'Test', email: 'bob.contacts.test@crm.local', password: 'Password123!', workspaceName: 'Workspace B Contact Tests' });
  const wsA = regA.user.workspaceId;
  const wsB = regB.user.workspaceId;
  const userA = regA.user;
  const userB = regB.user;

  try {
    // ── CREATE ──────────────────────────────────────────────────────────────
    console.log('--- Tests CREATE ---');
    const contact = await ContactsService.create(wsA, {
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

    // Création sans ownerId fourni (ownerId auto = admin du workspace)
    const contactNoOwner = await ContactsService.create(wsA, {
      firstName: 'Marie',
      lastName: 'Curie',
      phone: '+33698765432',
    });
    assert(Boolean(contactNoOwner.ownerId), 'Owner assigné automatiquement si absent');

    // Tentative d'utiliser un owner d'un autre workspace → erreur 400
    try {
      await ContactsService.create(wsA, { firstName: 'Test', lastName: 'Cross', phone: '+33600000001', ownerId: userB.id });
      assert(false, 'Cross-workspace owner devrait échouer');
    } catch (e: any) {
      assert(e.statusCode === 400, 'Cross-workspace owner rejeté avec 400');
    }

    // ── READ - LISTE / SEARCH / PAGINATION ──────────────────────────────────
    console.log('\n--- Tests READ (liste, search, pagination) ---');
    const list = await ContactsService.getAll(wsA, {});
    assert(list.data.length >= 2, 'Récupération de la liste des contacts du workspace');
    assert(typeof list.pagination.total === 'number', 'Pagination retournée');

    // Isolation : workspace B ne doit PAS voir les contacts de workspace A
    const listB = await ContactsService.getAll(wsB, {});
    assert(listB.data.every(c => c.workspaceId === wsB), 'Isolation workspace : workspace B ne voit pas les contacts de workspace A');

    // Recherche par prénom
    const searchResult = await ContactsService.getAll(wsA, { search: 'Jean' });
    assert(searchResult.data.some(c => c.firstName === 'Jean'), 'Recherche par prénom fonctionne');

    // Recherche par email
    const emailSearch = await ContactsService.getAll(wsA, { search: 'dupont@example' });
    assert(emailSearch.data.length > 0, 'Recherche par email fonctionne');

    // Pagination
    const page1 = await ContactsService.getAll(wsA, { page: 1, limit: 1 });
    assert(page1.data.length === 1, 'Pagination : limit=1 retourne 1 résultat');
    assert(page1.pagination.page === 1, 'Pagination : page=1 correcte');

    // READ par ID
    console.log('\n--- Tests READ (détail) ---');
    const detail = await ContactsService.getById(contact.id, wsA);
    assert(detail.id === contact.id, 'Récupération du détail d\'un contact existant');

    // Contact inexistant → 404
    try {
      await ContactsService.getById('non-existent-id', wsA);
      assert(false, '404 pour contact inexistant');
    } catch (e: any) {
      assert(e.statusCode === 404, 'Contact inexistant → 404');
    }

    // Cross-workspace read → 404
    try {
      await ContactsService.getById(contact.id, wsB);
      assert(false, 'Cross-workspace read devrait échouer');
    } catch (e: any) {
      assert(e.statusCode === 404, 'Cross-workspace read → 404');
    }

    // ── UPDATE ───────────────────────────────────────────────────────────────
    console.log('\n--- Tests UPDATE ---');
    const updated = await ContactsService.update(contact.id, wsA, { company: 'New Corp', tags: ['client', 'vip'] });
    assert(updated.company === 'New Corp', 'Mise à jour du champ société');
    assert(updated.tags === JSON.stringify(['client', 'vip']), 'Mise à jour des tags');

    // Update contact inexistant → 404
    try {
      await ContactsService.update('non-existent-id', wsA, { company: 'X' });
      assert(false, '404 pour mise à jour contact inexistant');
    } catch (e: any) {
      assert(e.statusCode === 404, 'Update contact inexistant → 404');
    }

    // Cross-workspace update → 404
    try {
      await ContactsService.update(contact.id, wsB, { company: 'Hacked' });
      assert(false, 'Cross-workspace update devrait échouer');
    } catch (e: any) {
      assert(e.statusCode === 404, 'Cross-workspace update → 404');
    }

    // ── DELETE ───────────────────────────────────────────────────────────────
    console.log('\n--- Tests DELETE ---');
    const toDelete = await ContactsService.create(wsA, { firstName: 'ToDelete', lastName: 'Contact', phone: '+33600000099' });

    await ContactsService.delete(toDelete.id, wsA);
    try {
      await ContactsService.getById(toDelete.id, wsA);
      assert(false, 'Suppression effective vérifiée');
    } catch (e: any) {
      assert(e.statusCode === 404, 'Contact supprimé → 404 à la récupération');
    }

    // Cross-workspace delete → 404
    try {
      await ContactsService.delete(contact.id, wsB);
      assert(false, 'Cross-workspace delete devrait échouer');
    } catch (e: any) {
      assert(e.statusCode === 404, 'Cross-workspace delete → 404');
    }

    console.log(`\n📊 Résultats : ${passed} réussis, ${failed} échoués.`);
    if (failed > 0) process.exit(1);

  } finally {
    // Nettoyage
    await prisma.contact.deleteMany({ where: { workspaceId: { in: [wsA, wsB] } } });
    await prisma.user.deleteMany({ where: { email: { in: ['alice.contacts.test@crm.local', 'bob.contacts.test@crm.local'] } } });
    await prisma.workspace.deleteMany({ where: { id: { in: [wsA, wsB] } } });
    await prisma.$disconnect();
  }
}

runTests().catch(e => { console.error('❌ Erreur critique:', e); process.exit(1); });

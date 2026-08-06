/**
 * NF-04 : jeu de données volumineux pour tests de performance.
 * À lancer après le seed principal : npm run prisma:seed && npm run prisma:seed:bulk
 */
import { PrismaClient } from '@prisma/client';
import { CallDirection, CallStatus } from '../src/types/enums.js';

const prisma = new PrismaClient();

const CONTACT_COUNT = 500;
const CALL_COUNT = 200;
const BATCH_SIZE = 100;

async function main() {
  console.log('📦 Démarrage du seed volumineux (NF-04)...');

  const admin = await prisma.user.findUnique({
    where: { email: 'admin@crm-telephony.local' },
    include: { workspace: true },
  });

  if (!admin) {
    console.error('❌ Utilisateur admin introuvable. Lancez d\'abord : npx prisma db seed');
    process.exit(1);
  }

  const users = await prisma.user.findMany({
    where: { workspaceId: admin.workspaceId, isActive: true },
  });

  if (users.length === 0) {
    console.error('❌ Aucun utilisateur actif dans le workspace.');
    process.exit(1);
  }

  const existingBulk = await prisma.contact.count({
    where: {
      workspaceId: admin.workspaceId,
      lastName: { startsWith: 'Bulk-' },
    },
  });

  if (existingBulk >= CONTACT_COUNT) {
    console.log(`ℹ️  ${existingBulk} contacts bulk déjà présents — seed bulk ignoré.`);
    return;
  }

  const contactsData = Array.from({ length: CONTACT_COUNT }, (_, i) => {
    const owner = users[i % users.length];
    return {
      firstName: 'Contact',
      lastName: `Bulk-${String(i + 1).padStart(4, '0')}`,
      company: i % 5 === 0 ? `Entreprise ${i + 1}` : null,
      phone: `+336${String(10_000_000 + i).slice(-8)}`,
      email: i % 3 === 0 ? `bulk${i + 1}@example.com` : null,
      tags: i % 4 === 0 ? JSON.stringify(['Prospect', 'Bulk']) : null,
      notes: i % 10 === 0 ? 'Contact généré pour tests de charge NF-04.' : null,
      ownerId: owner.id,
      workspaceId: admin.workspaceId,
    };
  });

  for (let i = 0; i < contactsData.length; i += BATCH_SIZE) {
    await prisma.contact.createMany({ data: contactsData.slice(i, i + BATCH_SIZE) });
    console.log(`  → ${Math.min(i + BATCH_SIZE, CONTACT_COUNT)} / ${CONTACT_COUNT} contacts`);
  }

  const bulkContacts = await prisma.contact.findMany({
    where: { workspaceId: admin.workspaceId, lastName: { startsWith: 'Bulk-' } },
    select: { id: true, phone: true },
    take: CALL_COUNT,
  });

  const callsData = bulkContacts.map((contact, i) => {
    const agent = users[i % users.length];
    const direction = i % 2 === 0 ? CallDirection.OUTBOUND : CallDirection.INBOUND;
    return {
      callerNumber: direction === CallDirection.OUTBOUND ? '+33180001122' : contact.phone,
      calledNumber: direction === CallDirection.OUTBOUND ? contact.phone : '+33180001122',
      direction,
      status: CallStatus.COMPLETED,
      duration: 60 + (i % 300),
      agentId: agent.id,
      contactId: contact.id,
      workspaceId: admin.workspaceId,
      startedAt: new Date(Date.now() - (i + 1) * 60_000),
      endedAt: new Date(Date.now() - i * 60_000),
    };
  });

  await prisma.call.createMany({ data: callsData });

  const totalContacts = await prisma.contact.count({ where: { workspaceId: admin.workspaceId } });
  const totalCalls = await prisma.call.count({ where: { workspaceId: admin.workspaceId } });

  console.log(`✅ Seed bulk terminé : ${totalContacts} contacts, ${totalCalls} appels dans le workspace.`);
}

main()
  .catch((e) => {
    console.error('❌ Erreur seed bulk :', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

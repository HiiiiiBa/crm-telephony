import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { Role, DealStage, CallDirection, CallStatus, MessageDirection, MessageStatus, PresenceStatus } from '../src/types/enums.js';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Démarrage du script de seed Prisma...');

  // Nettoyage préalable pour réinitialiser le seed proprement
  await prisma.notification.deleteMany();
  await prisma.message.deleteMany();
  await prisma.call.deleteMany();
  await prisma.deal.deleteMany();
  await prisma.contact.deleteMany();
  await prisma.user.deleteMany();
  await prisma.team.deleteMany();
  await prisma.workspace.deleteMany();

  // 1. Création de l'espace de travail (Workspace)
  const workspace = await prisma.workspace.create({
    data: {
      name: 'Acme Cloud Telephony Workspace',
    },
  });
  console.log(`✅ Espace de travail créé : ${workspace.name} (${workspace.id})`);

  // 2. Création de l'équipe
  const teamVentes = await prisma.team.create({
    data: {
      name: 'Équipe Ventes Nord',
      description: 'Équipe commerciale responsable de la région Nord & IDF',
      workspaceId: workspace.id,
    },
  });
  console.log(`✅ Équipe créée : ${teamVentes.name}`);

  // 3. Hachage des mots de passe avec bcrypt
  const saltRounds = 10;
  const adminPasswordHash = await bcrypt.hash('AdminPassword123!', saltRounds);
  const managerPasswordHash = await bcrypt.hash('ManagerPassword123!', saltRounds);
  const agentPasswordHash = await bcrypt.hash('AgentPassword123!', saltRounds);

  // 4. Création des Utilisateurs (1 Admin, 1 Manager, 1 Agent)
  const adminUser = await prisma.user.create({
    data: {
      firstName: 'Admin',
      lastName: 'Directeur',
      email: 'admin@crm-telephony.local',
      passwordHash: adminPasswordHash,
      role: Role.ADMIN,
      isActive: true,
      presenceStatus: PresenceStatus.ONLINE,
      presenceUpdatedAt: new Date(),
      phoneExtension: '101',
      workspaceId: workspace.id,
      teamId: teamVentes.id,
    },
  });

  const managerUser = await prisma.user.create({
    data: {
      firstName: 'Thomas',
      lastName: 'Manager',
      email: 'manager@crm-telephony.local',
      passwordHash: managerPasswordHash,
      role: Role.MANAGER,
      isActive: true,
      presenceStatus: PresenceStatus.ONLINE,
      presenceUpdatedAt: new Date(),
      phoneExtension: '102',
      workspaceId: workspace.id,
      teamId: teamVentes.id,
    },
  });

  const agentUser = await prisma.user.create({
    data: {
      firstName: 'Julie',
      lastName: 'Agent',
      email: 'agent@crm-telephony.local',
      passwordHash: agentPasswordHash,
      role: Role.AGENT,
      isActive: true,
      presenceStatus: PresenceStatus.PAUSE,
      presenceUpdatedAt: new Date(),
      phoneExtension: '103',
      workspaceId: workspace.id,
      teamId: teamVentes.id,
    },
  });
  console.log(`✅ Utilisateurs créés (1 Admin, 1 Manager, 1 Agent)`);

  // 5. Création des Contacts
  const contact1 = await prisma.contact.create({
    data: {
      firstName: 'Sophie',
      lastName: 'Martin',
      company: 'TechCorp France',
      phone: '+33612345678',
      email: 'sophie.martin@techcorp.fr',
      tags: JSON.stringify(['VIP', 'Client']),
      notes: 'Décideure principale sur le projet de téléphonie IP.',
      ownerId: adminUser.id,
      workspaceId: workspace.id,
    },
  });

  const contact2 = await prisma.contact.create({
    data: {
      firstName: 'Alexandre',
      lastName: 'Dubois',
      company: 'Nexus Logistics',
      phone: '+33698765432',
      email: 'alex.dubois@nexus.com',
      tags: JSON.stringify(['Prospect', 'Transport']),
      notes: 'Souhaite coupler leur CRM interne avec notre Dialer.',
      ownerId: managerUser.id,
      workspaceId: workspace.id,
    },
  });

  const contact3 = await prisma.contact.create({
    data: {
      firstName: 'Marie',
      lastName: 'Leroy',
      company: 'Innovate Studio',
      phone: '+33744556677',
      email: 'm.leroy@innovate.io',
      tags: JSON.stringify(['Négociation', 'PME']),
      notes: 'Demande un tarif préférentiel pour 20 lignes.',
      ownerId: agentUser.id,
      workspaceId: workspace.id,
    },
  });
  console.log(`✅ Contacts CRM créés (3 contacts)`);

  // 6. Création des Deals (Affaires commerciales)
  await prisma.deal.createMany({
    data: [
      {
        title: 'Licences Téléphonie Cloud 50p',
        value: 24000.0,
        stage: DealStage.PROPOSITION,
        contactId: contact1.id,
        ownerId: adminUser.id,
        workspaceId: workspace.id,
      },
      {
        title: 'Intégration CRM & API Dialer',
        value: 15000.0,
        stage: DealStage.QUALIFIE,
        contactId: contact2.id,
        ownerId: managerUser.id,
        workspaceId: workspace.id,
      },
      {
        title: 'Déploiement Téléphonie Siège (20 Lignes)',
        value: 65000.0,
        stage: DealStage.NEGOTIATION,
        contactId: contact3.id,
        ownerId: agentUser.id,
        workspaceId: workspace.id,
      },
    ],
  });
  console.log(`✅ Affaires commerciales (Deals) créées`);

  // 7. Création des Appels
  await prisma.call.createMany({
    data: [
      {
        callerNumber: contact1.phone,
        calledNumber: '+33180001122',
        direction: CallDirection.INBOUND,
        status: CallStatus.COMPLETED,
        duration: 225,
        agentId: adminUser.id,
        contactId: contact1.id,
        workspaceId: workspace.id,
        startedAt: new Date(Date.now() - 225000),
        endedAt: new Date(),
        note: 'Point d étape sur la proposition tarifaire.',
      },
      {
        callerNumber: '+33180001122',
        calledNumber: contact2.phone,
        direction: CallDirection.OUTBOUND,
        status: CallStatus.COMPLETED,
        duration: 312,
        agentId: managerUser.id,
        contactId: contact2.id,
        workspaceId: workspace.id,
        startedAt: new Date(Date.now() - 312000),
        endedAt: new Date(),
        note: 'Démonstration des fonctionnalités du Dialer.',
      },
      {
        callerNumber: contact3.phone,
        calledNumber: '+33180001122',
        direction: CallDirection.INBOUND,
        status: CallStatus.MISSED,
        duration: 0,
        agentId: agentUser.id,
        contactId: contact3.id,
        workspaceId: workspace.id,
        note: 'Appel manqué — Rappeler avant 18h.',
      },
    ],
  });
  console.log(`✅ Historique d appels créé`);

  // 8. Création des Messages SMS
  await prisma.message.createMany({
    data: [
      {
        content: 'Bonjour Sophie, nous avons bien reçu votre demande concernant l intégration Twilio.',
        fromNumber: '+33180001122',
        toNumber: contact1.phone,
        direction: MessageDirection.OUTBOUND,
        status: MessageStatus.DELIVERED,
        agentId: adminUser.id,
        contactId: contact1.id,
      },
      {
        content: 'Merci Admin, avez-vous une disponibilité cet après-midi pour un court appel ?',
        fromNumber: contact1.phone,
        toNumber: '+33180001122',
        direction: MessageDirection.INBOUND,
        status: MessageStatus.RECEIVED,
        agentId: adminUser.id,
        contactId: contact1.id,
      },
    ],
  });
  console.log(`✅ Messages SMS de test créés`);

  // 9. Notifications de démonstration
  await prisma.notification.createMany({
    data: [
      {
        type: 'MISSED_CALL',
        title: 'Appel manqué',
        body: `Appel manqué de ${contact3.firstName} ${contact3.lastName}`,
        link: `/contacts/${contact3.id}`,
        userId: agentUser.id,
        workspaceId: workspace.id,
        isRead: false,
      },
      {
        type: 'NEW_SMS',
        title: 'Nouveau SMS',
        body: `${contact1.firstName} ${contact1.lastName} : Merci Admin, avez-vous une disponibilité cet après-midi ?`,
        link: `/contacts/${contact1.id}?sms=1`,
        userId: adminUser.id,
        workspaceId: workspace.id,
        isRead: false,
      },
      {
        type: 'NEW_SMS',
        title: 'Nouveau SMS',
        body: `${contact2.firstName} ${contact2.lastName} : Pouvez-vous m envoyer la proposition ?`,
        link: `/contacts/${contact2.id}?sms=1`,
        userId: managerUser.id,
        workspaceId: workspace.id,
        isRead: false,
      },
      {
        type: 'SYSTEM',
        title: 'Bienvenue sur RingCRM',
        body: 'Votre espace de travail est configuré. Consultez le tableau de bord pour démarrer.',
        link: '/',
        userId: adminUser.id,
        workspaceId: workspace.id,
        isRead: true,
      },
    ],
  });
  console.log(`✅ Notifications de démonstration créées`);

  console.log('🎉 Seed Prisma terminé avec succès !');
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seed :', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import './setup.js';
import { prisma } from '../services/prisma.js';
import { AuthService } from '../modules/auth/auth.service.js';
import { MessagesService } from '../modules/messages/messages.service.js';
import { MessageDirection, MessageStatus } from '../types/enums.js';

async function runTests() {
  console.log('🧪 Tests module Messages (SMS mock)...\n');
  let passed = 0;
  let failed = 0;

  const assert = (cond: boolean, name: string) => {
    if (cond) { console.log(`  ✅ [PASS] ${name}`); passed++; }
    else { console.error(`  ❌ [FAIL] ${name}`); failed++; }
  };

  const adminEmail = 'messages.test.admin@crm.local';
  const contactEmail = 'messages.test.contact@crm.local';

  try {
    await prisma.message.deleteMany({});
    await prisma.contact.deleteMany({ where: { email: contactEmail } });
    await prisma.user.deleteMany({ where: { email: adminEmail } });

    const reg = await AuthService.register({
      firstName: 'Msg',
      lastName: 'Admin',
      email: adminEmail,
      password: 'Password123!',
      workspaceName: 'Messages Test WS',
    });

    const contact = await prisma.contact.create({
      data: {
        firstName: 'Client',
        lastName: 'SMS',
        phone: '+33611112222',
        email: contactEmail,
        ownerId: reg.user.id,
        workspaceId: reg.user.workspaceId,
      },
    });

    const auth = { userId: reg.user.id, workspaceId: reg.user.workspaceId, role: reg.user.role };

    console.log('--- Test 1 : Envoi SMS ---');
    const sent = await MessagesService.send(auth, {
      contactId: contact.id,
      content: 'Bonjour, test SMS depuis le CRM.',
    });
    assert(sent.direction === MessageDirection.OUTBOUND, 'Direction OUTBOUND');
    assert(sent.status === MessageStatus.DELIVERED, 'Statut DELIVERED (mock)');
    assert(sent.contactId === contact.id, 'Lié au contact');

    console.log('\n--- Test 2 : Liste messages par contact ---');
    const list = await MessagesService.listByContact(auth, contact.id);
    assert(list.length === 1, 'Un message en historique');
    assert(list[0].content.includes('test SMS'), 'Contenu correct');

    console.log('\n--- Test 3 : Conversations regroupées par contact (F-50) ---');
    const convs = await MessagesService.listConversations(auth);
    assert(convs.length === 1, 'Une conversation');
    assert(convs[0].contact.id === contact.id, 'Conversation liée au contact');
    assert(convs[0].messageCount === 1, 'Compteur messages');

    console.log('\n--- Test 4 : Webhook SMS entrant (F-52) ---');
    const inbound = await MessagesService.handleProviderWebhook(reg.user.workspaceId, {
      fromNumber: contact.phone,
      toNumber: '+33180001122',
      content: 'Réponse client via webhook.',
    });
    assert(inbound.direction === MessageDirection.INBOUND, 'Direction INBOUND');
    assert(inbound.status === MessageStatus.RECEIVED, 'Statut RECEIVED');

    const convsAfter = await MessagesService.listConversations(auth);
    assert(convsAfter[0].lastMessage.content.includes('webhook'), 'Dernier message = entrant');

    console.log('\n--- Test 5 : Format Twilio webhook ---');
    const twilioInbound = await MessagesService.handleProviderWebhook(reg.user.workspaceId, {
      From: contact.phone,
      To: '+33180001122',
      Body: 'Message Twilio simulé.',
      MessageSid: 'SMmock123',
    });
    assert(twilioInbound.content === 'Message Twilio simulé.', 'Parse Twilio Body');

    await prisma.message.deleteMany({});
    await prisma.contact.deleteMany({ where: { id: contact.id } });
    await prisma.user.deleteMany({ where: { workspaceId: reg.user.workspaceId } });
    await prisma.workspace.delete({ where: { id: reg.user.workspaceId } });

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

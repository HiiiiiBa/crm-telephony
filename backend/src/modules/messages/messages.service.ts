import { prisma } from '../../services/prisma.js';
import { AppError } from '../../middleware/errorHandler.js';
import { getSmsProvider } from '../../messaging/messaging.service.js';
import { MessageDirection, MessageStatus } from '../../types/enums.js';
import { ContactsService } from '../contacts/contacts.service.js';
import { buildMessageContactFilter } from './messages.permissions.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { NotificationType } from '../../types/enums.js';
import {
  AuthContext,
  ConversationSummary,
  InboundWebhookDTO,
  MessageWithAgent,
  SendMessageDTO,
} from './messages.types.js';

const DEFAULT_FROM_NUMBER = '+33180001122';

const agentSelect = { id: true, firstName: true, lastName: true, email: true };

const contactSelect = {
  id: true,
  firstName: true,
  lastName: true,
  phone: true,
  company: true,
};

export class MessagesService {
  /**
   * Envoi SMS via le provider (mock ou Twilio) puis enregistrement en base.
   */
  static async send(auth: AuthContext, data: SendMessageDTO): Promise<MessageWithAgent> {
    await ContactsService.assertContactAccessible(data.contactId, auth);

    const contact = await prisma.contact.findFirst({
      where: { id: data.contactId, workspaceId: auth.workspaceId },
    });

    if (!contact) {
      const err: AppError = new Error('Contact introuvable dans cet espace de travail.');
      err.statusCode = 404;
      throw err;
    }

    const agent = await prisma.user.findFirst({
      where: { id: auth.userId, workspaceId: auth.workspaceId, isActive: true },
    });

    if (!agent) {
      const err: AppError = new Error('Agent introuvable.');
      err.statusCode = 403;
      throw err;
    }

    const fromNumber = agent.phoneExtension
      ? (agent.phoneExtension.startsWith('+') ? agent.phoneExtension : `+33${agent.phoneExtension}`)
      : DEFAULT_FROM_NUMBER;

    const provider = getSmsProvider();
    const result = await provider.sendSms(fromNumber, contact.phone, data.content.trim());

    const message = await prisma.message.create({
      data: {
        content: data.content.trim(),
        fromNumber,
        toNumber: contact.phone,
        direction: MessageDirection.OUTBOUND,
        status: result.status,
        agentId: auth.userId,
        contactId: contact.id,
      },
      include: { agent: { select: agentSelect } },
    });

    return message as MessageWithAgent;
  }

  /** Conversations SMS regroupées par contact (F-50). */
  static async listConversations(auth: AuthContext): Promise<ConversationSummary[]> {
    const contactFilter = await buildMessageContactFilter(auth);

    const messages = await prisma.message.findMany({
      where: {
        contactId: { not: null },
        contact: contactFilter,
      },
      include: {
        agent: { select: agentSelect },
        contact: { select: contactSelect },
      },
      orderBy: { createdAt: 'desc' },
    });

    const byContact = new Map<string, ConversationSummary>();

    for (const msg of messages) {
      if (!msg.contactId || !msg.contact) continue;

      const existing = byContact.get(msg.contactId);
      if (!existing) {
        byContact.set(msg.contactId, {
          contact: msg.contact,
          lastMessage: msg as MessageWithAgent,
          messageCount: 1,
        });
      } else {
        existing.messageCount += 1;
      }
    }

    return Array.from(byContact.values()).sort(
      (a, b) => new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime()
    );
  }

  static async listByContact(auth: AuthContext, contactId: string): Promise<MessageWithAgent[]> {
    await ContactsService.assertContactAccessible(contactId, auth);

    const messages = await prisma.message.findMany({
      where: { contactId },
      include: { agent: { select: agentSelect } },
      orderBy: { createdAt: 'asc' },
    });

    return messages as MessageWithAgent[];
  }

  /**
   * Webhook messages entrants (F-52) — point d'intégration Twilio Messaging.
   */
  static async receiveInbound(data: InboundWebhookDTO): Promise<MessageWithAgent> {
    const contact = await prisma.contact.findFirst({
      where: {
        workspaceId: data.workspaceId,
        OR: [
          { phone: data.fromNumber },
          { phone: { contains: data.fromNumber.replace(/\s/g, '') } },
        ],
      },
    });

    if (!contact) {
      const err: AppError = new Error('Aucun contact correspondant à ce numéro.');
      err.statusCode = 404;
      throw err;
    }

    const agentId = contact.ownerId;

    const message = await prisma.message.create({
      data: {
        content: data.content.trim(),
        fromNumber: data.fromNumber,
        toNumber: data.toNumber,
        direction: MessageDirection.INBOUND,
        status: MessageStatus.RECEIVED,
        agentId,
        contactId: contact.id,
      },
      include: { agent: { select: agentSelect } },
    });

    await NotificationsService.create({
      userId: agentId,
      workspaceId: data.workspaceId,
      type: NotificationType.NEW_SMS,
      title: 'Nouveau SMS',
      body: `${contact.firstName} ${contact.lastName} : ${data.content.trim().slice(0, 100)}`,
      link: `/contacts/${contact.id}?sms=1`,
    });

    return message as MessageWithAgent;
  }

  static async handleProviderWebhook(workspaceId: string, body: unknown): Promise<MessageWithAgent> {
    const provider = getSmsProvider();
    const parsed = provider.parseInboundWebhook(body);

    if (!parsed) {
      const err: AppError = new Error('Payload webhook SMS invalide.');
      err.statusCode = 400;
      throw err;
    }

    return MessagesService.receiveInbound({
      workspaceId,
      fromNumber: parsed.fromNumber,
      toNumber: parsed.toNumber,
      content: parsed.content,
      externalId: parsed.externalId,
    });
  }
}

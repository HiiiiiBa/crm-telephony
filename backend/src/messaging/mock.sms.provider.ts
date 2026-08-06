import { MessageStatus } from '../types/enums.js';
import { InboundSmsPayload, SmsProvider, SmsSendResult } from './sms.types.js';

/**
 * Provider SMS simulé pour le développement.
 * Remplaçable par TwilioMessagingProvider sans modifier MessagesService.
 */
export class MockSmsProvider implements SmsProvider {
  async sendSms(_fromNumber: string, _toNumber: string, _content: string): Promise<SmsSendResult> {
    return {
      externalId: `mock-sms-${Date.now()}`,
      status: MessageStatus.DELIVERED,
    };
  }

  parseInboundWebhook(body: unknown): InboundSmsPayload | null {
    if (!body || typeof body !== 'object') return null;
    const b = body as Record<string, unknown>;

    // Format JSON interne (tests / simulation)
    if (typeof b.fromNumber === 'string' && typeof b.toNumber === 'string' && typeof b.content === 'string') {
      return {
        fromNumber: b.fromNumber,
        toNumber: b.toNumber,
        content: b.content,
        externalId: typeof b.externalId === 'string' ? b.externalId : undefined,
      };
    }

    // Format Twilio Messaging webhook (extrait minimal)
    if (typeof b.From === 'string' && typeof b.To === 'string' && typeof b.Body === 'string') {
      return {
        fromNumber: b.From,
        toNumber: b.To,
        content: b.Body,
        externalId: typeof b.MessageSid === 'string' ? b.MessageSid : undefined,
      };
    }

    return null;
  }
}

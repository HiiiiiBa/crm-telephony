import { MessageStatus } from '../types/enums.js';

export interface InboundSmsPayload {
  fromNumber: string;
  toNumber: string;
  content: string;
  externalId?: string;
}

export interface SmsSendResult {
  externalId?: string;
  status: MessageStatus;
}

/**
 * Point d'intégration opérateur SMS (Twilio Messaging, etc.).
 * Implémentation mock en dev ; remplaçable via setSmsProvider().
 */
export interface SmsProvider {
  sendSms(fromNumber: string, toNumber: string, content: string): Promise<SmsSendResult>;
  parseInboundWebhook(body: unknown): InboundSmsPayload | null;
}

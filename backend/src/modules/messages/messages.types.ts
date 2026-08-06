import { MessageDirection, MessageStatus } from '../../types/enums.js';

export interface AuthContext {
  userId: string;
  workspaceId: string;
  role: string;
}

export interface SendMessageDTO {
  contactId: string;
  content: string;
}

export interface MessageWithAgent {
  id: string;
  content: string;
  fromNumber: string;
  toNumber: string;
  direction: MessageDirection | string;
  status: MessageStatus | string;
  agentId: string;
  contactId: string | null;
  createdAt: Date;
  agent: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface ConversationContact {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  company: string | null;
}

export interface ConversationSummary {
  contact: ConversationContact;
  lastMessage: MessageWithAgent;
  messageCount: number;
}

export interface InboundWebhookDTO {
  workspaceId: string;
  fromNumber: string;
  toNumber: string;
  content: string;
  externalId?: string;
}

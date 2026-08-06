export enum MessageDirection {
  INBOUND = 'INBOUND',
  OUTBOUND = 'OUTBOUND',
}

export enum MessageStatus {
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  FAILED = 'FAILED',
  RECEIVED = 'RECEIVED',
}

export const MESSAGE_STATUS_LABELS: Record<string, string> = {
  SENT: 'Envoyé',
  DELIVERED: 'Délivré',
  FAILED: 'Échec',
  RECEIVED: 'Reçu',
};

export interface MessageAgent {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface Message {
  id: string;
  content: string;
  fromNumber: string;
  toNumber: string;
  direction: MessageDirection | string;
  status: MessageStatus | string;
  agentId: string;
  contactId: string | null;
  createdAt: string;
  agent: MessageAgent;
}

export interface SendMessageData {
  contactId: string;
  content: string;
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
  lastMessage: Message;
  messageCount: number;
}

export const formatMessageDate = (date: string): string =>
  new Date(date).toLocaleString('fr-FR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

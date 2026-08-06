import { apiFetch } from './api';
import { ConversationSummary, Message, SendMessageData } from '../types/messages.types';

export class MessagesService {
  static async sendMessage(data: SendMessageData): Promise<Message> {
    return apiFetch<Message>('/messages', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static async getConversations(): Promise<ConversationSummary[]> {
    return apiFetch<ConversationSummary[]>('/messages/conversations');
  }

  static async getContactMessages(contactId: string): Promise<Message[]> {
    return apiFetch<Message[]>(`/messages?contactId=${encodeURIComponent(contactId)}`);
  }
}

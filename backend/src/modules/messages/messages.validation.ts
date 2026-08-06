import { SendMessageDTO } from './messages.types.js';

export const validateSendMessage = (data: Partial<SendMessageDTO>): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!data.contactId || typeof data.contactId !== 'string') {
    errors.push('Le contact est obligatoire.');
  }

  if (!data.content || typeof data.content !== 'string' || !data.content.trim()) {
    errors.push('Le contenu du message est obligatoire.');
  } else if (data.content.trim().length > 1600) {
    errors.push('Le message ne peut pas dépasser 1600 caractères.');
  }

  return { isValid: errors.length === 0, errors };
};

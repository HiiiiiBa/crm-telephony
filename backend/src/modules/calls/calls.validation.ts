import { CallStatus } from '../../types/enums.js';
import { StartCallDTO, UpdateCallStatusDTO } from './calls.types.js';

const PHONE_REGEX = /^[+]?[\d\s\-().]{6,20}$/;
const VALID_STATUSES = Object.values(CallStatus);

export const validateStartCall = (data: Partial<StartCallDTO>): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!data.phoneNumber || typeof data.phoneNumber !== 'string' || !PHONE_REGEX.test(data.phoneNumber.trim())) {
    errors.push('Le numéro de téléphone est invalide.');
  }

  if (data.contactId !== undefined && data.contactId !== null && typeof data.contactId !== 'string') {
    errors.push('Le contact est invalide.');
  }

  return { isValid: errors.length === 0, errors };
};

export const validateUpdateCallStatus = (data: Partial<UpdateCallStatusDTO>): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!data.status || !VALID_STATUSES.includes(data.status)) {
    errors.push(`Le statut doit être l'un des suivants : ${VALID_STATUSES.join(', ')}.`);
  }

  return { isValid: errors.length === 0, errors };
};

export const normalizePhone = (phone: string): string => phone.replace(/[\s\-().]/g, '');

export const validateUpdateCallNote = (data: { note?: unknown }): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  if (data.note !== undefined && data.note !== null && typeof data.note !== 'string') {
    errors.push('La note doit être une chaîne de caractères.');
  } else if (typeof data.note === 'string' && data.note.length > 5000) {
    errors.push('La note ne peut pas dépasser 5000 caractères.');
  }
  return { isValid: errors.length === 0, errors };
};

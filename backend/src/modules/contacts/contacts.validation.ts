import { CreateContactDTO, UpdateContactDTO } from './contacts.types.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[+]?[\d\s\-().]{6,20}$/;

export const validateCreateContact = (data: Partial<CreateContactDTO>): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!data.firstName || typeof data.firstName !== 'string' || data.firstName.trim().length === 0) {
    errors.push('Le prénom est obligatoire.');
  } else if (data.firstName.trim().length > 100) {
    errors.push('Le prénom ne peut pas dépasser 100 caractères.');
  }

  if (!data.lastName || typeof data.lastName !== 'string' || data.lastName.trim().length === 0) {
    errors.push('Le nom est obligatoire.');
  } else if (data.lastName.trim().length > 100) {
    errors.push('Le nom ne peut pas dépasser 100 caractères.');
  }

  if (!data.phone || typeof data.phone !== 'string' || data.phone.trim().length === 0) {
    errors.push('Le numéro de téléphone est obligatoire.');
  } else if (!PHONE_REGEX.test(data.phone.trim())) {
    errors.push('Le format du numéro de téléphone est invalide.');
  }

  if (data.email && !EMAIL_REGEX.test(data.email.trim())) {
    errors.push('Le format de l\'adresse email est invalide.');
  }

  if (data.company && data.company.length > 200) {
    errors.push('Le nom de la société ne peut pas dépasser 200 caractères.');
  }

  if (data.notes && data.notes.length > 5000) {
    errors.push('Les notes ne peuvent pas dépasser 5000 caractères.');
  }

  if (data.tags !== undefined) {
    if (!Array.isArray(data.tags)) {
      errors.push('Les tags doivent être un tableau.');
    } else if (data.tags.some((t) => typeof t !== 'string' || t.trim().length === 0)) {
      errors.push('Chaque tag doit être une chaîne de caractères non vide.');
    }
  }

  return { isValid: errors.length === 0, errors };
};

export const validateUpdateContact = (data: Partial<UpdateContactDTO>): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (data.firstName !== undefined) {
    if (typeof data.firstName !== 'string' || data.firstName.trim().length === 0) {
      errors.push('Le prénom ne peut pas être vide.');
    } else if (data.firstName.trim().length > 100) {
      errors.push('Le prénom ne peut pas dépasser 100 caractères.');
    }
  }

  if (data.lastName !== undefined) {
    if (typeof data.lastName !== 'string' || data.lastName.trim().length === 0) {
      errors.push('Le nom ne peut pas être vide.');
    } else if (data.lastName.trim().length > 100) {
      errors.push('Le nom ne peut pas dépasser 100 caractères.');
    }
  }

  if (data.phone !== undefined) {
    if (typeof data.phone !== 'string' || data.phone.trim().length === 0) {
      errors.push('Le numéro de téléphone ne peut pas être vide.');
    } else if (!PHONE_REGEX.test(data.phone.trim())) {
      errors.push('Le format du numéro de téléphone est invalide.');
    }
  }

  if (data.email !== undefined && data.email !== null && data.email !== '' && !EMAIL_REGEX.test(data.email.trim())) {
    errors.push('Le format de l\'adresse email est invalide.');
  }

  if (data.company && data.company.length > 200) {
    errors.push('Le nom de la société ne peut pas dépasser 200 caractères.');
  }

  if (data.notes && data.notes.length > 5000) {
    errors.push('Les notes ne peuvent pas dépasser 5000 caractères.');
  }

  if (data.tags !== undefined) {
    if (!Array.isArray(data.tags)) {
      errors.push('Les tags doivent être un tableau.');
    } else if (data.tags.some((t) => typeof t !== 'string' || t.trim().length === 0)) {
      errors.push('Chaque tag doit être une chaîne de caractères non vide.');
    }
  }

  return { isValid: errors.length === 0, errors };
};

import { DealStage } from '../../types/enums.js';
import { CreateDealDTO, UpdateDealDTO, UpdateDealStageDTO } from './deals.types.js';

const VALID_STAGES = Object.values(DealStage);

export const validateCreateDeal = (data: Partial<CreateDealDTO>): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!data.title || typeof data.title !== 'string' || data.title.trim().length === 0) {
    errors.push('Le titre est obligatoire.');
  } else if (data.title.trim().length > 200) {
    errors.push('Le titre ne peut pas dépasser 200 caractères.');
  }

  if (data.value === undefined || data.value === null) {
    errors.push('La valeur est obligatoire.');
  } else if (typeof data.value !== 'number' || isNaN(data.value) || data.value < 0) {
    errors.push('La valeur doit être un nombre positif ou nul.');
  }

  if (!data.contactId || typeof data.contactId !== 'string') {
    errors.push('Le contact est obligatoire.');
  }

  if (data.stage !== undefined && !VALID_STAGES.includes(data.stage)) {
    errors.push(`L'étape doit être l'une des suivantes : ${VALID_STAGES.join(', ')}.`);
  }

  return { isValid: errors.length === 0, errors };
};

export const validateUpdateDeal = (data: Partial<UpdateDealDTO>): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (data.title !== undefined) {
    if (typeof data.title !== 'string' || data.title.trim().length === 0) {
      errors.push('Le titre ne peut pas être vide.');
    } else if (data.title.trim().length > 200) {
      errors.push('Le titre ne peut pas dépasser 200 caractères.');
    }
  }

  if (data.value !== undefined) {
    if (typeof data.value !== 'number' || isNaN(data.value) || data.value < 0) {
      errors.push('La valeur doit être un nombre positif ou nul.');
    }
  }

  if (data.stage !== undefined && !VALID_STAGES.includes(data.stage)) {
    errors.push(`L'étape doit être l'une des suivantes : ${VALID_STAGES.join(', ')}.`);
  }

  if (data.contactId !== undefined && typeof data.contactId !== 'string') {
    errors.push('Le contact est invalide.');
  }

  return { isValid: errors.length === 0, errors };
};

export const validateUpdateDealStage = (data: Partial<UpdateDealStageDTO>): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!data.stage || !VALID_STAGES.includes(data.stage)) {
    errors.push(`L'étape doit être l'une des suivantes : ${VALID_STAGES.join(', ')}.`);
  }

  return { isValid: errors.length === 0, errors };
};

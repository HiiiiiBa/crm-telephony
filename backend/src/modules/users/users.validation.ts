import { Role } from '../../types/enums.js';
import { InviteUserDTO, UpdateUserDTO } from './users.types.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const validateInviteUser = (data: Partial<InviteUserDTO>): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!data.firstName?.trim()) errors.push('Le prénom est obligatoire.');
  if (!data.lastName?.trim()) errors.push('Le nom de famille est obligatoire.');

  if (!data.email || !EMAIL_REGEX.test(data.email)) {
    errors.push('L\'adresse email est invalide.');
  }

  if (!data.password || data.password.length < 6) {
    errors.push('Le mot de passe doit contenir au moins 6 caractères.');
  }

  if (data.role && !Object.values(Role).includes(data.role)) {
    errors.push('Rôle invalide.');
  }

  return { isValid: errors.length === 0, errors };
};

export const validateUpdateUser = (data: Partial<UpdateUserDTO>): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (data.role === undefined && data.isActive === undefined && data.teamId === undefined && data.phoneExtension === undefined) {
    errors.push('Aucune modification fournie.');
  }

  if (data.role !== undefined && !Object.values(Role).includes(data.role)) {
    errors.push('Rôle invalide.');
  }

  if (data.isActive !== undefined && typeof data.isActive !== 'boolean') {
    errors.push('Le statut actif doit être un booléen.');
  }

  return { isValid: errors.length === 0, errors };
};

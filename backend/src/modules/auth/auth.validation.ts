import { RegisterDTO, LoginDTO } from './auth.types.js';

export const validateRegister = (data: Partial<RegisterDTO>): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!data.firstName || typeof data.firstName !== 'string' || data.firstName.trim().length === 0) {
    errors.push('Le prénom est obligatoire.');
  }

  if (!data.lastName || typeof data.lastName !== 'string' || data.lastName.trim().length === 0) {
    errors.push('Le nom de famille est obligatoire.');
  }

  if (!data.email || typeof data.email !== 'string') {
    errors.push('L\'adresse email est obligatoire.');
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      errors.push('L\'adresse email est invalide.');
    }
  }

  if (!data.password || typeof data.password !== 'string') {
    errors.push('Le mot de passe est obligatoire.');
  } else if (data.password.length < 6) {
    errors.push('Le mot de passe doit contenir au moins 6 caractères.');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const validateLogin = (data: Partial<LoginDTO>): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!data.email || typeof data.email !== 'string') {
    errors.push('L\'adresse email est obligatoire.');
  }

  if (!data.password || typeof data.password !== 'string') {
    errors.push('Le mot de passe est obligatoire.');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

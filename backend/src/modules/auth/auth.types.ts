import { Role } from '../../types/enums.js';

export interface RegisterDTO {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  workspaceName?: string;
  workspaceId?: string; // si invité dans un workspace existant
  role?: Role;
  phoneExtension?: string;
}

export interface LoginDTO {
  email: string;
  password: string;
}

export interface UserJwtPayload {
  userId: string;
  workspaceId: string;
  role: Role | string;
  email: string;
}

export interface PublicUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  isActive: boolean;
  phoneExtension?: string | null;
  workspaceId: string;
  teamId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthResponse {
  user: PublicUser;
  token: string;
}

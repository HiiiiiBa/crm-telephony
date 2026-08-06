import { Role } from '../../types/enums.js';
import { PublicUser } from '../auth/auth.types.js';

export interface InviteUserDTO {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role?: Role;
  phoneExtension?: string;
  teamId?: string;
}

export interface UpdateUserDTO {
  role?: Role;
  isActive?: boolean;
  teamId?: string | null;
  phoneExtension?: string | null;
}

export interface TeamMember extends PublicUser {
  team?: { id: string; name: string } | null;
}

export interface AuthActor {
  userId: string;
  workspaceId: string;
  role: string;
}

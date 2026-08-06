import { apiFetch } from './api';
import { UserProfile } from './auth.service';

export interface TeamMember extends UserProfile {
  team?: { id: string; name: string } | null;
}

export interface InviteUserData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role?: 'AGENT' | 'MANAGER';
}

export interface UpdateUserData {
  role?: 'AGENT' | 'MANAGER';
  isActive?: boolean;
}

export class UsersService {
  static async listUsers(): Promise<TeamMember[]> {
    return apiFetch<TeamMember[]>('/users', { method: 'GET' });
  }

  static async inviteUser(data: InviteUserData): Promise<TeamMember> {
    return apiFetch<TeamMember>('/users/invite', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static async updateUser(id: string, data: UpdateUserData): Promise<TeamMember> {
    return apiFetch<TeamMember>(`/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  static async deleteUser(id: string): Promise<void> {
    return apiFetch<void>(`/users/${id}`, { method: 'DELETE' });
  }
}

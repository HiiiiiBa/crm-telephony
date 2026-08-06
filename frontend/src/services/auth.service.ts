import { apiFetch } from './api';

export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'ADMIN' | 'MANAGER' | 'AGENT' | string;
  isActive: boolean;
  phoneExtension?: string | null;
  workspaceId: string;
  teamId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponseData {
  user: UserProfile;
  token: string;
}

export class AuthService {
  static async login(email: string, password: string): Promise<AuthResponseData> {
    return apiFetch<AuthResponseData>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  static async register(data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    workspaceName?: string;
  }): Promise<AuthResponseData> {
    return apiFetch<AuthResponseData>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static async getMe(): Promise<UserProfile> {
    return apiFetch<UserProfile>('/auth/me', {
      method: 'GET',
    });
  }

  static async getWorkspaceMembers(): Promise<UserProfile[]> {
    return apiFetch<UserProfile[]>('/auth/members', {
      method: 'GET',
    });
  }

  static async getSetupStatus(): Promise<{ isFirstUser: boolean }> {
    return apiFetch<{ isFirstUser: boolean }>('/auth/setup-status', {
      method: 'GET',
    });
  }
}

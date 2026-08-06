import { apiFetch } from './api';
import { AgentPresence, PresenceStatus, PresenceSummary } from '../types/presence.types';

export class PresenceService {
  static async getTeam(): Promise<AgentPresence[]> {
    return apiFetch<AgentPresence[]>('/presence/team');
  }

  static async getSummary(): Promise<PresenceSummary> {
    return apiFetch<PresenceSummary>('/presence/summary');
  }

  static async updateMyStatus(status: PresenceStatus): Promise<AgentPresence> {
    return apiFetch<AgentPresence>('/presence/me', {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  static async goOffline(): Promise<void> {
    const token = localStorage.getItem('crm_token');
    await fetch('/api/presence/offline', {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  }
}

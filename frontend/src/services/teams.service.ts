import { apiFetch } from './api';

export interface TeamSummary {
  id: string;
  name: string;
  description: string | null;
  memberCount: number;
}

export class TeamsService {
  static async listTeams(): Promise<TeamSummary[]> {
    return apiFetch<TeamSummary[]>('/teams');
  }

  static async createTeam(data: { name: string; description?: string }): Promise<TeamSummary> {
    return apiFetch<TeamSummary>('/teams', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}
